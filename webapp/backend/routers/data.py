"""
/api/data — Dataset overview and EDA endpoints.
"""

from fastapi import APIRouter

router = APIRouter()

# Static dataset facts from our validated notebook run
DATASET_STATS = {
    "total_raw":     1194,
    "total_clean":   1058,
    "cities":        7,
    "city_counts": {
        "casablanca": 215,
        "tanger":     198,
        "meknes":     198,
        "marrakech":  192,
        "rabat":      160,
        "agadir":     132,
        "oujda":       99,
    },
    "median_price_mad":  1_250_000,
    "mean_price_mad":    1_847_581,
    "target":            "price_dh",
    "source":            "Mubawab.ma",
    "scrape_date":       "March 2026",
    "missing": {
        "floor":    "45%",
        "standing": "78%",
        "num_rooms": "7%",
    },
}

FEATURES = [
    {"name": "city",         "type": "Categorical", "missing": "0%",   "note": "7 Moroccan cities"},
    {"name": "surface_m2",   "type": "Numeric",     "missing": "<1%",  "note": "Apartment area in m²"},
    {"name": "num_rooms",    "type": "Numeric",     "missing": "7%",   "note": "Total number of rooms"},
    {"name": "num_bathrooms","type": "Numeric",     "missing": "3%",   "note": "Number of bathrooms"},
    {"name": "floor",        "type": "Numeric",     "missing": "45%",  "note": "Floor level — heavily missing"},
    {"name": "state",        "type": "Categorical", "missing": "1%",   "note": "Construction state"},
    {"name": "standing",     "type": "Categorical", "missing": "78%",  "note": "High-end vs mid-range"},
    {"name": "price_dh",     "type": "Numeric (target)", "missing": "10%", "note": "Listed price in MAD"},
]

CORRELATIONS = [
    {"feature": "surface_m2",           "correlation": 0.62},
    {"feature": "surface_per_bathroom", "correlation": 0.43},
    {"feature": "num_bathrooms",        "correlation": 0.38},
    {"feature": "surface_per_room",     "correlation": 0.24},
    {"feature": "num_rooms",            "correlation": 0.21},
    {"feature": "floor",                "correlation": 0.14},
    {"feature": "rooms_per_bathroom",   "correlation": -0.13},
]

CHARTS = [
    {"id": "city_counts",    "title": "Listings per City",               "file": "chart1_city_counts.png"},
    {"id": "price_hist",     "title": "Price Distribution",              "file": "chart2_price_hist.png"},
    {"id": "price_surface",  "title": "Price vs. Surface by City",       "file": "chart3_price_surface.png"},
    {"id": "correlations",   "title": "Feature Correlations with Price", "file": "chart4_correlations.png"},
    {"id": "model_compare",  "title": "Model Comparison (CV RMSE)",      "file": "chart5_model_comparison.png"},
]


@router.get("/overview")
def get_overview():
    return DATASET_STATS


@router.get("/features")
def get_features():
    return FEATURES


@router.get("/correlations")
def get_correlations():
    return CORRELATIONS


@router.get("/charts")
def get_charts():
    return CHARTS
