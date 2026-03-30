"""
DataCo Morocco — Internship App Backend
FastAPI server wrapping the Moroccan Housing ML pipeline.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

load_dotenv()

from routers import data, model, mentor

app = FastAPI(
    title="DataCo Morocco — Internship API",
    description="Backend for the Moroccan Housing ML internship showcase app.",
    version="1.0.0",
)

frontend_urls = [url.strip() for url in os.getenv("FRONTEND_URL", "").split(",") if url.strip()]

# CORS — allow Next.js frontend (Vercel) and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://dataco.cc",
        "https://www.dataco.cc",
    ] + frontend_urls,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve pre-generated charts as static files
CHARTS_DIR = os.getenv("CHARTS_DIR", "../charts")
if os.path.exists(CHARTS_DIR):
    app.mount("/charts", StaticFiles(directory=CHARTS_DIR), name="charts")

# Routers
app.include_router(data.router,   prefix="/api/data",   tags=["Data"])
app.include_router(model.router,  prefix="/api/model",  tags=["Model"])
app.include_router(mentor.router, prefix="/api/mentor", tags=["Mentor"])


@app.get("/")
def health():
    return {"status": "ok", "app": "DataCo Morocco Internship API"}
