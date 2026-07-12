from pydantic import BaseModel
from typing import List, Optional

class SettingUpdate(BaseModel):
    depot_name: Optional[str] = None
    currency: Optional[str] = None
    distance_unit: Optional[str] = None

class SettingResponse(BaseModel):
    depot_name: str
    currency: str
    distance_unit: str
    class Config:
        from_attributes = True
