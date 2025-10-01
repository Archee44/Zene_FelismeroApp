from sqlalchemy import Column, Integer, String
from ..database import Base

class Track(Base):
    __tablename__ = "tracks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="Ismeretlen")
    artist = Column(String, default="Ismeretlen")
    genre = Column(String, default="Ismeretlen")
    bpm = Column(Integer, default=0)
    camelot = Column(String, default="Ismeretlen")
    path = Column(String)
