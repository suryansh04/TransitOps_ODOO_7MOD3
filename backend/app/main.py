from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers.auth import router as auth_router
from app.controllers.fleet import router as fleet_router
from app.controllers.ops import router as ops_router
from app.controllers.dashboard import router as dashboard_router

app = FastAPI(title="Hackathon API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for specific domains if needed for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(fleet_router)
app.include_router(ops_router)
app.include_router(dashboard_router)

@app.get("/health")
def health():
    return {"status": "ok"}