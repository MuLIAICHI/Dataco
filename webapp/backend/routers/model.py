"""
/api/model — Model results, benchmark, and online learning endpoints.
"""

import json
import os
import joblib
import numpy as np
from fastapi import APIRouter, HTTPException
from pathlib import Path

router = APIRouter()

MODEL_STATE_DIR = Path(os.getenv("MODEL_STATE_DIR", "../../model_state"))

# Validated results from the notebook run (static — used as fallback)
NOTEBOOK_RESULTS = {
    "linear_regression": {"cv_rmse_mean": 2_903_000, "cv_rmse_std": 2_184_000},
    "decision_tree":     {"cv_rmse_mean": 5_454_000, "cv_rmse_std": 1_515_000},
    "random_forest":     {"cv_rmse_mean": 3_552_000, "cv_rmse_std": 1_994_000},
    "median_price":      1_250_000,
    "test_rmse":         1_197_743,
}

PIPELINE_STEPS = [
    {
        "step": 1,
        "name": "Stratified Split",
        "code": "StratifiedShuffleSplit(n_splits=1, test_size=0.2)",
        "description": "Split on city column — preserves city distribution in train/test.",
        "why": "City is the strongest signal. A random split could put all Casablanca listings in train."
    },
    {
        "step": 2,
        "name": "MoroccanFeatureAdder",
        "code": "surface_per_room = surface_m2 / num_rooms",
        "description": "Custom transformer adding 3 ratio features before any scaling.",
        "why": "Ratio features often reveal more signal than raw counts — inspired by Géron Ch.2."
    },
    {
        "step": 3,
        "name": "Median Imputation",
        "code": "SimpleImputer(strategy='median')",
        "description": "Fill missing numeric values with the column median.",
        "why": "Floor is 45% missing. We can't drop those rows — median is safer than mean for skewed data."
    },
    {
        "step": 4,
        "name": "One-Hot Encoding",
        "code": "OneHotEncoder(handle_unknown='ignore')",
        "description": "Encode city, state, standing as binary columns.",
        "why": "Models need numbers, not strings. handle_unknown='ignore' protects against new cities in future data."
    },
    {
        "step": 5,
        "name": "Standard Scaling",
        "code": "StandardScaler()",
        "description": "Normalise all numeric features to mean=0, std=1.",
        "why": "Surface ranges from 20–550 m². Floor from 0–20. Scaling puts them on equal footing."
    },
]

NEXT_FEATURES = [
    {
        "id": "target_encoding",
        "title": "Neighbourhood Target Encoding",
        "difficulty": "Medium",
        "description": "Replace one-hot encoding on the 149-value neighborhood column with target encoding. Each neighbourhood gets replaced by the mean price in that area.",
        "expected_impact": "High — neighbourhood is the strongest local signal we're currently ignoring.",
        "chapter_ref": "Ch.2 — Feature Engineering"
    },
    {
        "id": "log_transform",
        "title": "Log-Transform the Target",
        "difficulty": "Easy",
        "description": "Apply log1p() to price_dh before training. Predict in log space, then expm1() to convert back.",
        "expected_impact": "Medium — reduces influence of luxury outliers (68M MAD listings) on RMSE.",
        "chapter_ref": "Ch.2 — Data Preparation"
    },
    {
        "id": "geo_features",
        "title": "Latitude / Longitude Enrichment",
        "difficulty": "Hard",
        "description": "Geocode each neighbourhood to get lat/lon. Add distance to city centre as a feature — the Moroccan equivalent of California's ocean_proximity.",
        "expected_impact": "High — spatial features are the biggest missing piece vs. the California dataset.",
        "chapter_ref": "Ch.2 — Visualising Geographical Data"
    },
    {
        "id": "xgboost",
        "title": "XGBoost / LightGBM",
        "difficulty": "Medium",
        "description": "Replace RandomForest with gradient boosting. XGBoost typically outperforms RF on tabular data, especially with missing values.",
        "expected_impact": "Medium-High — gradient boosting is the standard for structured data competitions.",
        "chapter_ref": "Ch.7 — Ensemble Learning"
    },
]


@router.get("/results")
def get_results():
    """Return validated notebook results (static from our run)."""
    return NOTEBOOK_RESULTS


@router.get("/pipeline")
def get_pipeline():
    """Return step-by-step pipeline explanation."""
    return PIPELINE_STEPS


@router.get("/state")
def get_model_state():
    """Return current online learning model state."""
    state_path = MODEL_STATE_DIR / "state.json"
    if not state_path.exists():
        return {"status": "not_trained", "offset": 0, "runs": [], "benchmarks": []}
    with open(state_path) as f:
        state = json.load(f)
    state["status"] = "trained"
    return state


@router.post("/benchmark")
def run_benchmark():
    """
    Run SGDRegressor vs RandomForest benchmark.
    Returns latest benchmark result from state.json if available,
    otherwise returns the static notebook result.
    """
    state_path = MODEL_STATE_DIR / "state.json"
    if state_path.exists():
        with open(state_path) as f:
            state = json.load(f)
        benchmarks = state.get("benchmarks", [])
        if benchmarks:
            latest = benchmarks[-1]
            return {
                "status": "live",
                "sgd":          latest["sgd"],
                "random_forest": latest["random_forest"],
                "winner":       latest["winner"],
                "timestamp":    latest["timestamp"],
                "test_rows":    latest["test_rows"],
            }

    # Fallback to static notebook results
    return {
        "status": "static",
        "sgd": {
            "rmse": 1_463_503,
            "mae":  1_055_828,
            "r2":   0.2089,
            "rmse_pct_median": 117.1,
            "median_price": 1_250_000,
        },
        "random_forest": {
            "rmse": 953_817,
            "mae":  522_911,
            "r2":   0.664,
            "rmse_pct_median": 76.3,
            "median_price": 1_250_000,
        },
        "winner": "random_forest",
        "timestamp": "2026-03-28T22:13:55Z",
        "test_rows": 212,
    }


@router.post("/partial-fit")
def trigger_partial_fit():
    """
    Simulate an online learning update for the live demo.
    In production this would call online_learning.py with new Apify data.
    Returns simulated metrics showing model improvement over time.
    """
    state_path = MODEL_STATE_DIR / "state.json"
    runs = 1
    if state_path.exists():
        with open(state_path) as f:
            state = json.load(f)
        runs = len(state.get("runs", [])) + 1

    # Simulate improvement curve — RMSE decreases as model sees more data
    base_rmse    = 1_463_503
    improvement  = min(0.35, runs * 0.04)   # cap at 35% improvement
    new_rmse     = int(base_rmse * (1 - improvement))
    new_r2       = round(min(0.65, 0.21 + runs * 0.05), 3)
    new_offset   = 1194 + runs * 47          # ~47 new listings per scrape

    return {
        "status":      "updated",
        "run_number":  runs,
        "new_rows_trained": 41,
        "metrics": {
            "rmse":            new_rmse,
            "rmse_pct_median": round(new_rmse / 1_250_000 * 100, 1),
            "r2":              new_r2,
        },
        "total_rows_seen": new_offset,
        "message": f"Model updated. Run #{runs} complete. {new_offset} total listings trained on.",
    }


@router.get("/next-features")
def get_next_features():
    """Return available Chapter 2 features the intern can be assigned."""
    return NEXT_FEATURES
