from Music_analyzer.backend.database import Base, engine
from Music_analyzer.backend.models.music import Track

Base.metadata.create_all(bind=engine)

print("Database initialized and tables created.")