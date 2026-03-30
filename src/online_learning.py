"""
Moroccan Housing Price — Online Learning Pipeline
==================================================
Pulls listings from Apify Dataset (mubawab-housing) and incrementally
updates an SGDRegressor model using partial_fit().

Inspired by Chapter 2 (and Chapter 1 online learning concepts) of
Aurélien Géron's "Hands-On Machine Learning".

Usage
-----
  # First time (cold start — no saved model yet):
  python online_learning.py

  # Every subsequent Apify run (incremental update):
  python online_learning.py

  # Force a full cold start (resets everything):
  python online_learning.py --reset

  # Benchmark SGDRegressor vs Random Forest on a held-out test set:
  python online_learning.py --benchmark --local-csv dataset_mubawab-housing.csv

State files written to ./model_state/:
  preprocessor.joblib   — fit once, never changed after cold start
  model.joblib          — SGDRegressor weights, updated each run
  state.json            — tracks offset (rows seen) + run history + benchmark history
"""

import argparse
import json
import os
import warnings
import numpy as np
import pandas as pd
import requests
import joblib
from pathlib import Path
from datetime import datetime, timezone

from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import SGDRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────
# CONFIGURATION — edit these before first run
# ─────────────────────────────────────────────

APIFY_API_TOKEN   = os.getenv("APIFY_API_TOKEN", "YOUR_APIFY_TOKEN_HERE")  # Read from env in CI/CD
APIFY_DATASET_ID  = "mubawab-housing"               # named dataset or dataset ID
APIFY_API_BASE    = "https://api.apify.com/v2"

STATE_DIR         = Path("./model_state")
PREPROCESSOR_PATH = STATE_DIR / "preprocessor.joblib"
MODEL_PATH        = STATE_DIR / "model.joblib"
STATE_PATH        = STATE_DIR / "state.json"

# Columns used by the model
NUM_FEATURES = [
    "surface_m2", "num_rooms", "num_bathrooms", "floor",
    # Engineered features added by MoroccanFeatureAdder:
    "surface_per_room", "rooms_per_bathroom", "surface_per_bathroom",
]
CAT_FEATURES = ["city", "state", "standing"]
TARGET       = "price_dh"

# SGDRegressor hyperparameters (tuned for this dataset)
SGD_PARAMS = {
    "loss":          "squared_error",
    "penalty":       "l2",
    "alpha":         0.01,         # regularisation
    "learning_rate": "invscaling", # lr decays over time — good for online learning
    "eta0":          0.01,
    "max_iter":      1,            # one pass per batch (that's the point of partial_fit)
    "tol":           None,
    "random_state":  42,
}

# Pull at most this many rows per API call (Apify limit is 250k)
BATCH_LIMIT = 5000


# ─────────────────────────────────────────────
# FEATURE ENGINEERING TRANSFORMER
# ─────────────────────────────────────────────

class MoroccanFeatureAdder(BaseEstimator, TransformerMixin):
    """Adds ratio features. Fits into sklearn pipelines via partial_fit compat."""
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        X["surface_per_room"]     = X["surface_m2"] / X["num_rooms"].replace(0, np.nan)
        X["rooms_per_bathroom"]   = X["num_rooms"]  / X["num_bathrooms"].replace(0, np.nan)
        X["surface_per_bathroom"] = X["surface_m2"] / X["num_bathrooms"].replace(0, np.nan)
        return X


# ─────────────────────────────────────────────
# DATA CLEANING
# ─────────────────────────────────────────────

def clean_batch(df: pd.DataFrame) -> pd.DataFrame:
    """Apply the same cleaning logic as the validation notebook."""
    # Keep only sale listings
    df = df[df["transaction_type"].isin(["vente", "unknown"])].copy()

    # Drop duplicate listing_ids within this batch
    df = df.drop_duplicates(subset="listing_id", keep="first")

    # Drop rows with no price (our target)
    df = df.dropna(subset=[TARGET])

    # Drop leaky and irrelevant columns
    drop_cols = [
        "listing_id", "listing_title", "listing_url", "scraped_at",
        "property_type", "price_per_m2", "transaction_type",
    ]
    df = df.drop(columns=[c for c in drop_cols if c in df.columns])

    return df.reset_index(drop=True)


def prepare_X_y(df: pd.DataFrame):
    """Separate features from target. Returns (X_df, y_series)."""
    y = np.log1p(df[TARGET].values)   # log-transform: prices are right-skewed
    X = df.drop(columns=[TARGET])
    return X, y


# ─────────────────────────────────────────────
# APIFY API
# ─────────────────────────────────────────────

def fetch_from_apify(offset: int = 0, limit: int = BATCH_LIMIT) -> pd.DataFrame:
    """
    Pull rows from the Apify dataset starting at `offset`.
    Returns a DataFrame (empty if no new rows).
    """
    url = f"{APIFY_API_BASE}/datasets/{APIFY_DATASET_ID}/items"
    params = {
        "token":  APIFY_API_TOKEN,
        "format": "json",
        "offset": offset,
        "limit":  limit,
        "fields": ",".join([
            "city", "floor", "listing_id", "listing_title", "listing_url",
            "neighborhood", "num_bathrooms", "num_rooms", "price_dh",
            "price_per_m2", "property_type", "scraped_at", "standing",
            "state", "surface_m2", "transaction_type",
        ]),
    }

    print(f"  Fetching rows {offset} → {offset + limit} from Apify...")
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()

    data = resp.json()
    if not data:
        print("  No new rows found.")
        return pd.DataFrame()

    df = pd.DataFrame(data)
    print(f"  Fetched {len(df)} raw rows.")
    return df


def fetch_from_csv(csv_path: str, offset: int = 0, limit: int = BATCH_LIMIT) -> pd.DataFrame:
    """
    Local fallback: read from CSV file, simulating Apify's offset/limit.
    Used for testing without a live Apify token.
    """
    df = pd.read_csv(csv_path)
    batch = df.iloc[offset : offset + limit]
    if batch.empty:
        print("  No new rows found.")
        return pd.DataFrame()
    print(f"  Loaded {len(batch)} raw rows from CSV (offset={offset}).")
    return batch.reset_index(drop=True)


# ─────────────────────────────────────────────
# STATE MANAGEMENT
# ─────────────────────────────────────────────

def load_state() -> dict:
    if STATE_PATH.exists():
        with open(STATE_PATH) as f:
            return json.load(f)
    return {"offset": 0, "runs": []}


def save_state(state: dict):
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    with open(STATE_PATH, "w") as f:
        json.dump(state, f, indent=2)


def is_cold_start() -> bool:
    return not (PREPROCESSOR_PATH.exists() and MODEL_PATH.exists())


# ─────────────────────────────────────────────
# PREPROCESSOR — built once, frozen forever
# ─────────────────────────────────────────────

def build_and_fit_preprocessor(X: pd.DataFrame) -> ColumnTransformer:
    """
    Fit the preprocessor on the initial dataset.
    After cold start this is saved and never re-fit.
    """
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
    ])
    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="constant", fill_value="unknown")),
        ("onehot",  OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    preprocessor = ColumnTransformer([
        ("num", num_pipeline, NUM_FEATURES),
        ("cat", cat_pipeline, CAT_FEATURES),
    ], remainder="drop")

    feature_adder = MoroccanFeatureAdder()
    X_eng = feature_adder.transform(X)
    preprocessor.fit(X_eng)

    print(f"  Preprocessor fit. Output shape: {preprocessor.transform(X_eng).shape}")
    return preprocessor


def transform_X(X: pd.DataFrame, preprocessor: ColumnTransformer) -> np.ndarray:
    """Add engineered features then apply frozen preprocessor."""
    feature_adder = MoroccanFeatureAdder()
    X_eng = feature_adder.transform(X)
    return preprocessor.transform(X_eng)


# ─────────────────────────────────────────────
# EVALUATION
# ─────────────────────────────────────────────

def evaluate(model, preprocessor, X: pd.DataFrame, y_log: np.ndarray):
    """Print RMSE and MAE in original MAD scale (after reversing log transform)."""
    X_proc = transform_X(X, preprocessor)
    y_pred_log = model.predict(X_proc)

    # Reverse the log transform for interpretable metrics
    y_true = np.expm1(y_log)
    y_pred = np.expm1(y_pred_log)

    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae  = mean_absolute_error(y_true, y_pred)
    med  = np.median(y_true)

    print(f"  RMSE : {rmse:>12,.0f} MAD  ({rmse/med*100:.1f}% of median price)")
    print(f"  MAE  : {mae:>12,.0f} MAD  ({mae/med*100:.1f}% of median price)")
    print(f"  Median price: {med:>10,.0f} MAD")
    return {"rmse": round(rmse), "mae": round(mae), "median_price": round(med)}


# ─────────────────────────────────────────────
# COLD START
# ─────────────────────────────────────────────

def cold_start(data_source, source_kwargs: dict, state: dict):
    """
    Full initial fit on all available data.
    Fits the preprocessor + does the first partial_fit() on SGDRegressor.
    Saves model and preprocessor.
    """
    print("\n=== COLD START ===")
    print("No saved model found. Training from scratch on all available data.")

    # Fetch everything from offset 0
    raw = data_source(offset=0, limit=BATCH_LIMIT, **source_kwargs)
    if raw.empty:
        print("No data available. Aborting.")
        return

    df = clean_batch(raw)
    if df.empty:
        print("No usable data after cleaning. Aborting.")
        return

    print(f"  Clean rows for cold start: {len(df)}")
    X, y = prepare_X_y(df)

    # Fit preprocessor once
    preprocessor = build_and_fit_preprocessor(X)
    X_proc = transform_X(X, preprocessor)

    # Initial partial_fit — pass classes=None for regression
    model = SGDRegressor(**SGD_PARAMS)
    model.partial_fit(X_proc, y)

    # Evaluate on the same data (training performance only — no test set here)
    print("\n  Training set performance:")
    metrics = evaluate(model, preprocessor, X, y)

    # Save everything
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(preprocessor, PREPROCESSOR_PATH)
    joblib.dump(model, MODEL_PATH)

    state["offset"] = len(raw)  # track how many raw rows we've processed
    state["runs"].append({
        "type":        "cold_start",
        "timestamp":   datetime.now(timezone.utc).isoformat(),
        "rows_seen":   len(df),
        "total_offset": state["offset"],
        "metrics":     metrics,
    })
    save_state(state)

    print(f"\n  Model saved. Offset set to {state['offset']}.")
    print("  Next run will only pull new rows from Apify.")


# ─────────────────────────────────────────────
# INCREMENTAL UPDATE
# ─────────────────────────────────────────────

def incremental_update(data_source, source_kwargs: dict, state: dict):
    """
    Pull only new rows (since last offset), call partial_fit() on existing model.
    """
    print("\n=== INCREMENTAL UPDATE ===")
    offset = state["offset"]
    print(f"  Resuming from offset {offset} (rows already trained on).")

    # Load saved model and preprocessor
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    model        = joblib.load(MODEL_PATH)

    # Fetch only new rows
    raw = data_source(offset=offset, limit=BATCH_LIMIT, **source_kwargs)
    if raw.empty:
        print("  Nothing new to train on. Model unchanged.")
        return

    df = clean_batch(raw)
    if df.empty:
        print("  New rows found but none usable after cleaning. Model unchanged.")
        state["offset"] += len(raw)
        save_state(state)
        return

    print(f"  Clean new rows: {len(df)}")
    X, y = prepare_X_y(df)

    # Preprocess with the FROZEN preprocessor (no re-fitting)
    X_proc = transform_X(X, preprocessor)

    # Incremental update — this is the core of online learning
    model.partial_fit(X_proc, y)

    # Evaluate on the new batch
    print("\n  New batch performance:")
    metrics = evaluate(model, preprocessor, X, y)

    # Save updated model (preprocessor unchanged)
    joblib.dump(model, MODEL_PATH)

    state["offset"] += len(raw)
    state["runs"].append({
        "type":         "incremental_update",
        "timestamp":    datetime.now(timezone.utc).isoformat(),
        "new_rows":     len(df),
        "total_offset": state["offset"],
        "metrics":      metrics,
    })
    save_state(state)

    print(f"\n  Model updated. New offset: {state['offset']}.")


# ─────────────────────────────────────────────
# BENCHMARK — SGDRegressor vs Random Forest
# ─────────────────────────────────────────────

def _metrics_dict(y_true, y_pred):
    """Return RMSE, MAE, R² in original MAD scale."""
    rmse = round(float(np.sqrt(mean_squared_error(y_true, y_pred))))
    mae  = round(float(mean_absolute_error(y_true, y_pred)))
    r2   = round(float(r2_score(y_true, y_pred)), 4)
    med  = round(float(np.median(y_true)))
    return {"rmse": rmse, "mae": mae, "r2": r2, "median_price": med,
            "rmse_pct_median": round(rmse / med * 100, 1)}


def _print_comparison(sgd_m: dict, rf_m: dict):
    """Pretty-print side-by-side comparison table."""
    width = 52
    print("\n" + "─" * width)
    print(f"  {'Metric':<22} {'SGDRegressor':>12} {'RandomForest':>12}")
    print("─" * width)
    for key, label in [("rmse", "RMSE (MAD)"), ("mae", "MAE (MAD)"),
                        ("rmse_pct_median", "RMSE % of median"), ("r2", "R²")]:
        s = f"{sgd_m[key]:>12,.4g}" if isinstance(sgd_m[key], float) else f"{sgd_m[key]:>12,}"
        r = f"{rf_m[key]:>12,.4g}"  if isinstance(rf_m[key], float)  else f"{rf_m[key]:>12,}"
        print(f"  {label:<22} {s} {r}")
    print("─" * width)

    # Verdict
    winner = "RandomForest" if rf_m["rmse"] < sgd_m["rmse"] else "SGDRegressor"
    gap_pct = abs(sgd_m["rmse"] - rf_m["rmse"]) / max(sgd_m["rmse"], rf_m["rmse"]) * 100
    print(f"\n  Winner: {winner}  (RMSE gap: {gap_pct:.1f}%)")
    if winner == "RandomForest":
        print("  ⚠  Online model is lagging — consider more partial_fit() passes")
        print("     or collecting more data before the next Apify run.")
    else:
        print("  ✓  Online model is competitive with the batch baseline.")


def run_benchmark(data_source, source_kwargs: dict, state: dict):
    """
    Benchmark the current SGDRegressor against a freshly trained RandomForest
    on a stratified held-out test set (20%).

    Both models use the SAME frozen preprocessor — only the estimator differs.
    The RandomForest is trained fresh on the train split (batch mode).
    The SGDRegressor is the live online model — NOT retrained here.

    Results are printed and appended to state.json for drift tracking.
    """
    print("\n=== BENCHMARK: SGDRegressor vs RandomForest ===")

    if is_cold_start():
        print("  No saved model found. Run cold start first.")
        return

    # ── Load data ──────────────────────────────────────────────
    raw = data_source(offset=0, limit=BATCH_LIMIT, **source_kwargs)
    if raw.empty:
        print("  No data available for benchmarking.")
        return

    df = clean_batch(raw)
    print(f"  Clean rows available: {len(df)}")

    # Stratified split on city (same as validation notebook)
    splitter = StratifiedShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    for train_idx, test_idx in splitter.split(df, df["city"]):
        df_train = df.iloc[train_idx].copy()
        df_test  = df.iloc[test_idx].copy()

    X_train, y_train_log = prepare_X_y(df_train)
    X_test,  y_test_log  = prepare_X_y(df_test)

    print(f"  Train: {len(df_train)} rows  |  Test: {len(df_test)} rows")

    # ── Load frozen preprocessor ────────────────────────────────
    preprocessor = joblib.load(PREPROCESSOR_PATH)

    X_train_proc = transform_X(X_train, preprocessor)
    X_test_proc  = transform_X(X_test,  preprocessor)

    # ── SGDRegressor — live online model, predict only ──────────
    sgd_model = joblib.load(MODEL_PATH)
    sgd_pred_log  = sgd_model.predict(X_test_proc)
    sgd_pred_mad  = np.expm1(sgd_pred_log)
    y_test_mad    = np.expm1(y_test_log)
    sgd_metrics   = _metrics_dict(y_test_mad, sgd_pred_mad)

    print("\n  SGDRegressor (online — no retraining):")
    print(f"    RMSE : {sgd_metrics['rmse']:>12,} MAD  ({sgd_metrics['rmse_pct_median']}% of median)")
    print(f"    MAE  : {sgd_metrics['mae']:>12,} MAD")
    print(f"    R²   : {sgd_metrics['r2']:>12.4f}")

    # ── RandomForest — batch trained fresh on train split ───────
    print("\n  Training RandomForest on train split (batch)...")
    rf = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    rf.fit(X_train_proc, y_train_log)

    rf_pred_log = rf.predict(X_test_proc)
    rf_pred_mad = np.expm1(rf_pred_log)
    rf_metrics  = _metrics_dict(y_test_mad, rf_pred_mad)

    print(f"    RMSE : {rf_metrics['rmse']:>12,} MAD  ({rf_metrics['rmse_pct_median']}% of median)")
    print(f"    MAE  : {rf_metrics['mae']:>12,} MAD")
    print(f"    R²   : {rf_metrics['r2']:>12.4f}")

    # ── Comparison table ────────────────────────────────────────
    _print_comparison(sgd_metrics, rf_metrics)

    # ── Persist benchmark result ────────────────────────────────
    bench_entry = {
        "type":        "benchmark",
        "timestamp":   datetime.now(timezone.utc).isoformat(),
        "test_rows":   len(df_test),
        "train_rows":  len(df_train),
        "sgd":         sgd_metrics,
        "random_forest": rf_metrics,
        "winner":      "random_forest" if rf_metrics["rmse"] < sgd_metrics["rmse"] else "sgd",
    }
    state.setdefault("benchmarks", []).append(bench_entry)
    save_state(state)
    print(f"\n  Benchmark saved to {STATE_PATH}")

    # ── Drift summary across all benchmarks ─────────────────────
    benchmarks = state.get("benchmarks", [])
    if len(benchmarks) > 1:
        print("\n  ── Drift history (SGD RMSE over time) ──")
        for b in benchmarks:
            ts  = b["timestamp"][:10]
            rmse = b["sgd"]["rmse"]
            pct  = b["sgd"]["rmse_pct_median"]
            print(f"    {ts}  SGD RMSE: {rmse:>10,} MAD  ({pct}% of median)")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Moroccan Housing Online Learning")
    parser.add_argument("--reset", action="store_true",
                        help="Force cold start — wipes saved model and state")
    parser.add_argument("--local-csv", type=str, default=None,
                        help="Use a local CSV instead of Apify API (for testing)")
    parser.add_argument("--benchmark", action="store_true",
                        help="Compare current online model vs Random Forest on a held-out test set")
    args = parser.parse_args()

    # Reset if requested
    if args.reset:
        print("--reset flag detected. Wiping saved model state...")
        for f in [PREPROCESSOR_PATH, MODEL_PATH, STATE_PATH]:
            if f.exists():
                f.unlink()
                print(f"  Deleted {f}")

    # Choose data source: local CSV (testing) or live Apify API
    if args.local_csv:
        print(f"[DEV MODE] Using local CSV: {args.local_csv}")
        data_source   = fetch_from_csv
        source_kwargs = {"csv_path": args.local_csv}
    else:
        if APIFY_API_TOKEN == "YOUR_APIFY_TOKEN_HERE":
            raise ValueError(
                "Set your APIFY_API_TOKEN in the script config section, or export it as an ENV variable "
                "or pass --local-csv for local testing."
            )
        data_source   = fetch_from_apify
        source_kwargs = {}

    state = load_state()

    print(f"\nMubawab Housing — Online Learning Pipeline")
    print(f"Run timestamp: {datetime.now(timezone.utc).isoformat()}")
    print(f"Previous runs: {len(state['runs'])}")
    print(f"Current offset: {state['offset']} rows already trained on")

    if args.benchmark:
        run_benchmark(data_source, source_kwargs, state)
    elif is_cold_start():
        cold_start(data_source, source_kwargs, state)
    else:
        incremental_update(data_source, source_kwargs, state)

    print("\nDone.")


if __name__ == "__main__":
    main()
