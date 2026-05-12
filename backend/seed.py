"""Seed initial data: 1 admin, 2 dietitians, 2 delivery staff, sample meals.

Run from backend directory: python seed.py
"""
import os
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv
import bcrypt

load_dotenv()


def hash_pw(p):
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def main():
    mongo = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
    db = mongo[os.getenv("MONGO_DB", "healthy_tomorrow")]

    users = [
        {"email": "admin@healthytomorrow.app", "name": "Admin", "role": "admin",
         "password": "admin123"},
        {"email": "sarah@healthytomorrow.app", "name": "Sarah Chen",
         "role": "dietitian", "password": "dietitian123",
         "bio": "Registered dietitian, 8+ years specializing in weight management.",
         "specialties": ["Weight loss", "Sports nutrition"]},
        {"email": "marco@healthytomorrow.app", "name": "Marco Diaz",
         "role": "dietitian", "password": "dietitian123",
         "bio": "Plant-based nutrition expert.",
         "specialties": ["Vegan", "Diabetes management"]},
        {"email": "alex@healthytomorrow.app", "name": "Alex Rider",
         "role": "delivery", "password": "delivery123"},
        {"email": "jamie@healthytomorrow.app", "name": "Jamie Lin",
         "role": "delivery", "password": "delivery123"},
        {"email": "demo@healthytomorrow.app", "name": "Demo Customer",
         "role": "customer", "password": "demo123"},
    ]
    for u in users:
        if db.users.find_one({"email": u["email"]}):
            continue
        doc = {**u, "password_hash": hash_pw(u.pop("password")),
               "addresses": [], "favorites": [], "email_verified": True,
               "suspended": False, "created_at": datetime.utcnow()}
        db.users.insert_one(doc)
        print(f"created user: {u['email']}")

    meals = [
        {"name": "Mediterranean Buddha Bowl", "price": 14.50, "calories": 520,
         "protein": 22, "carbs": 65, "fat": 18, "category": "Bowl", "vegan": True,
         "description": "Quinoa, roasted veg, hummus, olives, fresh herbs.",
         "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
         "ingredients": ["Quinoa", "Chickpeas", "Cucumber", "Olives", "Hummus"],
         "allergens": ["sesame"]},
        {"name": "Grilled Salmon Plate", "price": 19.00, "calories": 610,
         "protein": 42, "carbs": 35, "fat": 30, "category": "Protein", "vegan": False,
         "description": "Wild salmon, lemon-dill rice, asparagus.",
         "image_url": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
         "ingredients": ["Salmon", "Brown rice", "Asparagus", "Lemon"],
         "allergens": ["fish"]},
        {"name": "Avocado Power Toast", "price": 9.50, "calories": 380,
         "protein": 14, "carbs": 38, "fat": 20, "category": "Breakfast", "vegan": True,
         "description": "Sourdough, smashed avocado, chili flakes, lime.",
         "image_url": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800",
         "ingredients": ["Sourdough", "Avocado", "Chili", "Lime"],
         "allergens": ["gluten"]},
        {"name": "Thai Coconut Curry", "price": 13.00, "calories": 540,
         "protein": 18, "carbs": 60, "fat": 25, "category": "Bowl", "vegan": True,
         "description": "Tofu, jasmine rice, coconut-curry sauce, bok choy.",
         "image_url": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800",
         "ingredients": ["Tofu", "Coconut milk", "Jasmine rice", "Bok choy"],
         "allergens": ["soy"]},
        {"name": "Chicken Caesar Wrap", "price": 11.50, "calories": 470,
         "protein": 32, "carbs": 40, "fat": 18, "category": "Wrap", "vegan": False,
         "description": "Grilled chicken, romaine, parmesan, light caesar.",
         "image_url": "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800",
         "ingredients": ["Chicken", "Romaine", "Parmesan", "Tortilla"],
         "allergens": ["gluten", "dairy"]},
        {"name": "Berry Greek Yogurt", "price": 7.00, "calories": 260,
         "protein": 18, "carbs": 30, "fat": 6, "category": "Snack", "vegan": False,
         "description": "Greek yogurt, mixed berries, honey, granola.",
         "image_url": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800",
         "ingredients": ["Greek yogurt", "Blueberries", "Granola", "Honey"],
         "allergens": ["dairy", "gluten"]},
        {"name": "Sweet Potato Black Bean Bowl", "price": 12.00, "calories": 490,
         "protein": 19, "carbs": 70, "fat": 14, "category": "Bowl", "vegan": True,
         "description": "Roasted sweet potato, black beans, brown rice, lime crema.",
         "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
         "ingredients": ["Sweet potato", "Black beans", "Brown rice", "Lime"],
         "allergens": []},
        {"name": "Egg White Veggie Scramble", "price": 10.00, "calories": 320,
         "protein": 28, "carbs": 18, "fat": 14, "category": "Breakfast", "vegan": False,
         "description": "Egg whites, spinach, mushrooms, feta, whole grain toast.",
         "image_url": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800",
         "ingredients": ["Eggs", "Spinach", "Mushrooms", "Feta"],
         "allergens": ["egg", "dairy", "gluten"]},
    ]
    for m in meals:
        if db.meals.find_one({"name": m["name"]}):
            continue
        m.update({"rating_avg": 0, "rating_count": 0, "created_at": datetime.utcnow()})
        db.meals.insert_one(m)
        print(f"created meal: {m['name']}")

    print("\nSeed complete.")
    print("Admin:    admin@healthytomorrow.app / admin123")
    print("Customer: demo@healthytomorrow.app / demo123")
    print("Dietitian: sarah@healthytomorrow.app / dietitian123")
    print("Delivery:  alex@healthytomorrow.app / delivery123")


if __name__ == "__main__":
    main()
