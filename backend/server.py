from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header, Query, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'ridatour_secret')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

# Object Storage Config
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "ridatour"
storage_key = None

# Create the main app
app = FastAPI(title="RiDATOUR API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ================== OBJECT STORAGE ==================
def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ================== PYDANTIC MODELS ==================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str  # super_admin, branch_manager, sales, marketing, operations, finance
    branch: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    branch: Optional[str]
    phone: Optional[str]
    is_active: bool
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class CustomerCreate(BaseModel):
    full_name: str
    nik: Optional[str] = None
    passport_number: Optional[str] = None
    passport_expiry: Optional[str] = None
    birth_date: Optional[str] = None
    phone: str
    email: Optional[str] = None
    city: Optional[str] = None
    branch: str
    notes: Optional[str] = None

class CustomerResponse(BaseModel):
    id: str
    full_name: str
    nik: Optional[str]
    passport_number: Optional[str]
    passport_expiry: Optional[str]
    birth_date: Optional[str]
    phone: str
    email: Optional[str]
    city: Optional[str]
    branch: str
    notes: Optional[str]
    created_at: str

class LeadCreate(BaseModel):
    name: str
    phone: str
    source: str  # Meta Ads, TikTok, Referral, WhatsApp
    campaign_name: Optional[str] = None
    branch: str
    assigned_sales: Optional[str] = None
    status: str = "New"  # New, Contacted, Follow Up, Hot, Deal, Lost
    estimated_departure: Optional[str] = None
    budget_range: Optional[str] = None
    notes: Optional[str] = None

class LeadResponse(BaseModel):
    id: str
    name: str
    phone: str
    source: str
    campaign_name: Optional[str]
    branch: str
    assigned_sales: Optional[str]
    assigned_sales_name: Optional[str] = None
    status: str
    estimated_departure: Optional[str]
    budget_range: Optional[str]
    notes: Optional[str]
    created_at: str
    updated_at: str

class TripCreate(BaseModel):
    trip_code: str  # e.g., UMR-MAR-2026-01
    package_name: str
    departure_date: str
    return_date: str
    airline: Optional[str] = None
    hotel_mecca: Optional[str] = None
    hotel_madina: Optional[str] = None
    seat_quota: int
    tour_leader: Optional[str] = None
    price: float
    status: str = "Open"  # Open, Full, Closed
    description: Optional[str] = None

class TripResponse(BaseModel):
    id: str
    trip_code: str
    package_name: str
    departure_date: str
    return_date: str
    airline: Optional[str]
    hotel_mecca: Optional[str]
    hotel_madina: Optional[str]
    seat_quota: int
    seats_remaining: int
    tour_leader: Optional[str]
    price: float
    status: str
    description: Optional[str]
    created_at: str

class BookingCreate(BaseModel):
    customer_id: str
    trip_id: str
    sales_id: str
    branch: str
    package_price: float
    down_payment: float
    notes: Optional[str] = None

class BookingResponse(BaseModel):
    id: str
    customer_id: str
    customer_name: Optional[str] = None
    trip_id: str
    trip_name: Optional[str] = None
    sales_id: str
    sales_name: Optional[str] = None
    branch: str
    package_price: float
    down_payment: float
    total_paid: float
    remaining_balance: float
    payment_status: str  # Pending, Partial, Paid
    document_status: str  # Incomplete, Complete
    created_at: str
    updated_at: str

class PaymentCreate(BaseModel):
    booking_id: str
    amount: float
    method: str = "Transfer"
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: str
    booking_id: str
    booking_customer_name: Optional[str] = None
    payment_date: str
    amount: float
    method: str
    proof_url: Optional[str]
    approval_status: str  # Pending, Approved, Rejected
    approved_by: Optional[str]
    approved_by_name: Optional[str] = None
    notes: Optional[str]
    created_at: str

class DocumentUpdate(BaseModel):
    passport: Optional[bool] = None
    ktp: Optional[bool] = None
    photo: Optional[bool] = None
    vaccination: Optional[bool] = None
    mahram_doc: Optional[bool] = None
    visa_status: Optional[str] = None
    ticket_status: Optional[str] = None

class DocumentResponse(BaseModel):
    id: str
    booking_id: str
    customer_name: Optional[str] = None
    passport: bool
    ktp: bool
    photo: bool
    vaccination: bool
    mahram_doc: bool
    visa_status: str
    ticket_status: str
    passport_url: Optional[str] = None
    ktp_url: Optional[str] = None
    photo_url: Optional[str] = None
    vaccination_url: Optional[str] = None
    mahram_doc_url: Optional[str] = None
    created_at: str
    updated_at: str

# ================== HELPER FUNCTIONS ==================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str, role: str, branch: str = None) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "branch": branch,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def check_role(allowed_roles: List[str]):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

def filter_by_branch(user: dict, query: dict) -> dict:
    if user["role"] not in ["super_admin"]:
        query["branch"] = user.get("branch")
    return query

# ================== AUTH ROUTES ==================
@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "role": user_data.role,
        "branch": user_data.branch,
        "phone": user_data.phone,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_dict)
    del user_dict["password"]
    del user_dict["_id"]
    return user_dict

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account disabled")
    
    token = create_token(user["id"], user["email"], user["role"], user.get("branch"))
    user_response = {k: v for k, v in user.items() if k not in ["password", "_id"]}
    return {"access_token": token, "token_type": "bearer", "user": user_response}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return user

# ================== USER ROUTES ==================
@api_router.get("/users", response_model=List[UserResponse])
async def get_users(user: dict = Depends(check_role(["super_admin", "branch_manager"]))):
    query = {}
    if user["role"] == "branch_manager":
        query["branch"] = user.get("branch")
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, user: dict = Depends(check_role(["super_admin", "branch_manager"]))):
    found = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not found:
        raise HTTPException(status_code=404, detail="User not found")
    return found

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, update_data: dict, user: dict = Depends(check_role(["super_admin"]))):
    if "password" in update_data:
        update_data["password"] = hash_password(update_data["password"])
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    updated = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return updated

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(check_role(["super_admin"]))):
    await db.users.delete_one({"id": user_id})
    return {"message": "User deleted"}

@api_router.get("/users/role/{role}", response_model=List[UserResponse])
async def get_users_by_role(role: str, user: dict = Depends(get_current_user)):
    query = {"role": role}
    query = filter_by_branch(user, query)
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    return users

# ================== CUSTOMER ROUTES ==================
@api_router.post("/customers", response_model=CustomerResponse)
async def create_customer(data: CustomerCreate, user: dict = Depends(check_role(["super_admin", "branch_manager", "sales", "marketing"]))):
    customer_dict = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["id"]
    }
    await db.customers.insert_one(customer_dict)
    del customer_dict["_id"]
    return customer_dict

@api_router.get("/customers", response_model=List[CustomerResponse])
async def get_customers(user: dict = Depends(get_current_user)):
    query = filter_by_branch(user, {})
    customers = await db.customers.find(query, {"_id": 0}).to_list(1000)
    return customers

@api_router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, user: dict = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@api_router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, data: CustomerCreate, user: dict = Depends(check_role(["super_admin", "branch_manager", "sales"]))):
    await db.customers.update_one({"id": customer_id}, {"$set": data.model_dump()})
    updated = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    return updated

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, user: dict = Depends(check_role(["super_admin"]))):
    await db.customers.delete_one({"id": customer_id})
    return {"message": "Customer deleted"}

# ================== LEAD ROUTES ==================
@api_router.post("/leads", response_model=LeadResponse)
async def create_lead(data: LeadCreate, user: dict = Depends(check_role(["super_admin", "branch_manager", "marketing"]))):
    lead_dict = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["id"]
    }
    await db.leads.insert_one(lead_dict)
    del lead_dict["_id"]
    return lead_dict

@api_router.get("/leads", response_model=List[LeadResponse])
async def get_leads(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = filter_by_branch(user, {})
    if user["role"] == "sales":
        query["assigned_sales"] = user["id"]
    if status:
        query["status"] = status
    leads = await db.leads.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich with sales names
    for lead in leads:
        if lead.get("assigned_sales"):
            sales = await db.users.find_one({"id": lead["assigned_sales"]}, {"_id": 0})
            lead["assigned_sales_name"] = sales["full_name"] if sales else None
    return leads

@api_router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: str, user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.get("assigned_sales"):
        sales = await db.users.find_one({"id": lead["assigned_sales"]}, {"_id": 0})
        lead["assigned_sales_name"] = sales["full_name"] if sales else None
    return lead

@api_router.put("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead(lead_id: str, data: dict, user: dict = Depends(check_role(["super_admin", "branch_manager", "marketing", "sales"]))):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.leads.update_one({"id": lead_id}, {"$set": data})
    updated = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if updated.get("assigned_sales"):
        sales = await db.users.find_one({"id": updated["assigned_sales"]}, {"_id": 0})
        updated["assigned_sales_name"] = sales["full_name"] if sales else None
    return updated

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, user: dict = Depends(check_role(["super_admin", "branch_manager", "marketing"]))):
    await db.leads.delete_one({"id": lead_id})
    return {"message": "Lead deleted"}

# ================== TRIP ROUTES ==================
@api_router.post("/trips", response_model=TripResponse)
async def create_trip(data: TripCreate, user: dict = Depends(check_role(["super_admin", "operations"]))):
    trip_dict = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "seats_remaining": data.seat_quota,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["id"]
    }
    await db.trips.insert_one(trip_dict)
    del trip_dict["_id"]
    return trip_dict

@api_router.get("/trips", response_model=List[TripResponse])
async def get_trips(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    trips = await db.trips.find(query, {"_id": 0}).to_list(1000)
    return trips

@api_router.get("/trips/{trip_id}", response_model=TripResponse)
async def get_trip(trip_id: str, user: dict = Depends(get_current_user)):
    trip = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@api_router.put("/trips/{trip_id}", response_model=TripResponse)
async def update_trip(trip_id: str, data: dict, user: dict = Depends(check_role(["super_admin", "operations"]))):
    await db.trips.update_one({"id": trip_id}, {"$set": data})
    updated = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    return updated

@api_router.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str, user: dict = Depends(check_role(["super_admin"]))):
    await db.trips.delete_one({"id": trip_id})
    return {"message": "Trip deleted"}

@api_router.get("/trips/{trip_id}/manifest")
async def get_trip_manifest(trip_id: str, user: dict = Depends(check_role(["super_admin", "operations"]))):
    trip = await db.trips.find_one({"id": trip_id}, {"_id": 0})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    bookings = await db.bookings.find({"trip_id": trip_id}, {"_id": 0}).to_list(1000)
    manifest = []
    for booking in bookings:
        customer = await db.customers.find_one({"id": booking["customer_id"]}, {"_id": 0})
        document = await db.documents.find_one({"booking_id": booking["id"]}, {"_id": 0})
        manifest.append({
            "booking": booking,
            "customer": customer,
            "document": document
        })
    return {"trip": trip, "manifest": manifest}

# ================== BOOKING ROUTES ==================
@api_router.post("/bookings", response_model=BookingResponse)
async def create_booking(data: BookingCreate, user: dict = Depends(check_role(["super_admin", "branch_manager", "sales"]))):
    if data.down_payment <= 0:
        raise HTTPException(status_code=400, detail="Down payment is required")
    
    # Check trip availability
    trip = await db.trips.find_one({"id": data.trip_id}, {"_id": 0})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip["seats_remaining"] <= 0:
        raise HTTPException(status_code=400, detail="No seats available")
    
    booking_dict = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "total_paid": data.down_payment,
        "remaining_balance": data.package_price - data.down_payment,
        "payment_status": "Partial" if data.down_payment < data.package_price else "Paid",
        "document_status": "Incomplete",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["id"]
    }
    await db.bookings.insert_one(booking_dict)
    
    # Update trip seats
    await db.trips.update_one({"id": data.trip_id}, {"$inc": {"seats_remaining": -1}})
    
    # Create document record
    doc_dict = {
        "id": str(uuid.uuid4()),
        "booking_id": booking_dict["id"],
        "passport": False,
        "ktp": False,
        "photo": False,
        "vaccination": False,
        "mahram_doc": False,
        "visa_status": "Pending",
        "ticket_status": "Pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.documents.insert_one(doc_dict)
    
    # Create initial payment record
    payment_dict = {
        "id": str(uuid.uuid4()),
        "booking_id": booking_dict["id"],
        "payment_date": datetime.now(timezone.utc).isoformat(),
        "amount": data.down_payment,
        "method": "Transfer",
        "proof_url": None,
        "approval_status": "Pending",
        "approved_by": None,
        "notes": "Down Payment",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(payment_dict)
    
    del booking_dict["_id"]
    return booking_dict

@api_router.get("/bookings", response_model=List[BookingResponse])
async def get_bookings(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = filter_by_branch(user, {})
    if user["role"] == "sales":
        query["sales_id"] = user["id"]
    if status:
        query["payment_status"] = status
    bookings = await db.bookings.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich with names
    for booking in bookings:
        customer = await db.customers.find_one({"id": booking["customer_id"]}, {"_id": 0})
        trip = await db.trips.find_one({"id": booking["trip_id"]}, {"_id": 0})
        sales = await db.users.find_one({"id": booking["sales_id"]}, {"_id": 0})
        booking["customer_name"] = customer["full_name"] if customer else None
        booking["trip_name"] = trip["package_name"] if trip else None
        booking["sales_name"] = sales["full_name"] if sales else None
    return bookings

@api_router.get("/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    customer = await db.customers.find_one({"id": booking["customer_id"]}, {"_id": 0})
    trip = await db.trips.find_one({"id": booking["trip_id"]}, {"_id": 0})
    sales = await db.users.find_one({"id": booking["sales_id"]}, {"_id": 0})
    booking["customer_name"] = customer["full_name"] if customer else None
    booking["trip_name"] = trip["package_name"] if trip else None
    booking["sales_name"] = sales["full_name"] if sales else None
    return booking

@api_router.put("/bookings/{booking_id}", response_model=BookingResponse)
async def update_booking(booking_id: str, data: dict, user: dict = Depends(check_role(["super_admin", "branch_manager", "operations"]))):
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.bookings.update_one({"id": booking_id}, {"$set": data})
    updated = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return updated

@api_router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str, user: dict = Depends(check_role(["super_admin"]))):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if booking:
        await db.trips.update_one({"id": booking["trip_id"]}, {"$inc": {"seats_remaining": 1}})
    await db.bookings.delete_one({"id": booking_id})
    await db.documents.delete_one({"booking_id": booking_id})
    await db.payments.delete_many({"booking_id": booking_id})
    return {"message": "Booking deleted"}

# ================== PAYMENT ROUTES ==================
@api_router.post("/payments", response_model=PaymentResponse)
async def create_payment(data: PaymentCreate, user: dict = Depends(check_role(["super_admin", "branch_manager", "sales", "finance"]))):
    booking = await db.bookings.find_one({"id": data.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    payment_dict = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "payment_date": datetime.now(timezone.utc).isoformat(),
        "proof_url": None,
        "approval_status": "Pending",
        "approved_by": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(payment_dict)
    del payment_dict["_id"]
    return payment_dict

@api_router.get("/payments", response_model=List[PaymentResponse])
async def get_payments(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if status:
        query["approval_status"] = status
    payments = await db.payments.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich with customer names
    for payment in payments:
        booking = await db.bookings.find_one({"id": payment["booking_id"]}, {"_id": 0})
        if booking:
            customer = await db.customers.find_one({"id": booking["customer_id"]}, {"_id": 0})
            payment["booking_customer_name"] = customer["full_name"] if customer else None
        if payment.get("approved_by"):
            approver = await db.users.find_one({"id": payment["approved_by"]}, {"_id": 0})
            payment["approved_by_name"] = approver["full_name"] if approver else None
    return payments

@api_router.get("/payments/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: str, user: dict = Depends(get_current_user)):
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@api_router.put("/payments/{payment_id}/approve")
async def approve_payment(payment_id: str, user: dict = Depends(check_role(["super_admin", "finance"]))):
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    await db.payments.update_one({"id": payment_id}, {"$set": {
        "approval_status": "Approved",
        "approved_by": user["id"]
    }})
    
    # Update booking total_paid and remaining_balance
    booking = await db.bookings.find_one({"id": payment["booking_id"]}, {"_id": 0})
    if booking:
        new_total = booking["total_paid"] + payment["amount"]
        new_remaining = booking["package_price"] - new_total
        new_status = "Paid" if new_remaining <= 0 else "Partial"
        await db.bookings.update_one({"id": booking["id"]}, {"$set": {
            "total_paid": new_total,
            "remaining_balance": max(0, new_remaining),
            "payment_status": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }})
    
    return {"message": "Payment approved"}

@api_router.put("/payments/{payment_id}/reject")
async def reject_payment(payment_id: str, user: dict = Depends(check_role(["super_admin", "finance"]))):
    await db.payments.update_one({"id": payment_id}, {"$set": {
        "approval_status": "Rejected",
        "approved_by": user["id"]
    }})
    return {"message": "Payment rejected"}

@api_router.post("/payments/{payment_id}/upload-proof")
async def upload_payment_proof(payment_id: str, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/payments/{payment_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "image/jpeg")
    
    await db.payments.update_one({"id": payment_id}, {"$set": {"proof_url": result["path"]}})
    return {"message": "Proof uploaded", "path": result["path"]}

# ================== DOCUMENT ROUTES ==================
@api_router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(user: dict = Depends(get_current_user)):
    documents = await db.documents.find({}, {"_id": 0}).to_list(1000)
    for doc in documents:
        booking = await db.bookings.find_one({"id": doc["booking_id"]}, {"_id": 0})
        if booking:
            customer = await db.customers.find_one({"id": booking["customer_id"]}, {"_id": 0})
            doc["customer_name"] = customer["full_name"] if customer else None
    return documents

@api_router.get("/documents/{booking_id}", response_model=DocumentResponse)
async def get_document(booking_id: str, user: dict = Depends(get_current_user)):
    document = await db.documents.find_one({"booking_id": booking_id}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if booking:
        customer = await db.customers.find_one({"id": booking["customer_id"]}, {"_id": 0})
        document["customer_name"] = customer["full_name"] if customer else None
    return document

@api_router.put("/documents/{booking_id}", response_model=DocumentResponse)
async def update_document(booking_id: str, data: DocumentUpdate, user: dict = Depends(check_role(["super_admin", "operations"]))):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.documents.update_one({"booking_id": booking_id}, {"$set": update_data})
    
    # Check if all documents are complete
    doc = await db.documents.find_one({"booking_id": booking_id}, {"_id": 0})
    if doc and all([doc.get("passport"), doc.get("ktp"), doc.get("photo"), doc.get("vaccination")]):
        await db.bookings.update_one({"id": booking_id}, {"$set": {"document_status": "Complete"}})
    
    return doc

@api_router.post("/documents/{booking_id}/upload/{doc_type}")
async def upload_document(booking_id: str, doc_type: str, file: UploadFile = File(...), user: dict = Depends(check_role(["super_admin", "operations", "sales"]))):
    if doc_type not in ["passport", "ktp", "photo", "vaccination", "mahram_doc"]:
        raise HTTPException(status_code=400, detail="Invalid document type")
    
    document = await db.documents.find_one({"booking_id": booking_id}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Document record not found")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    path = f"{APP_NAME}/documents/{booking_id}/{doc_type}_{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    
    await db.documents.update_one({"booking_id": booking_id}, {"$set": {
        doc_type: True,
        f"{doc_type}_url": result["path"],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    
    return {"message": f"{doc_type} uploaded", "path": result["path"]}

@api_router.get("/files/{path:path}")
async def download_file(path: str, authorization: str = Header(None), auth: str = Query(None)):
    auth_header = authorization or (f"Bearer {auth}" if auth else None)
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authorization required")
    
    try:
        token = auth_header.replace("Bearer ", "")
        jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    data, content_type = get_object(path)
    return Response(content=data, media_type=content_type)

# ================== DASHBOARD ROUTES ==================
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    branch_filter = {} if user["role"] == "super_admin" else {"branch": user.get("branch")}
    
    # Get current month range
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    # Leads stats
    total_leads = await db.leads.count_documents(branch_filter)
    leads_this_month = await db.leads.count_documents({**branch_filter, "created_at": {"$gte": month_start}})
    leads_by_status = {}
    for status in ["New", "Contacted", "Follow Up", "Hot", "Deal", "Lost"]:
        leads_by_status[status] = await db.leads.count_documents({**branch_filter, "status": status})
    
    # Conversion rate
    deal_leads = await db.leads.count_documents({**branch_filter, "status": "Deal"})
    conversion_rate = (deal_leads / total_leads * 100) if total_leads > 0 else 0
    
    # Bookings & Revenue
    bookings = await db.bookings.find(branch_filter, {"_id": 0}).to_list(10000)
    total_bookings = len(bookings)
    total_revenue = sum(b.get("total_paid", 0) for b in bookings)
    outstanding = sum(b.get("remaining_balance", 0) for b in bookings if b.get("remaining_balance", 0) > 0)
    
    # Revenue by branch (for super admin)
    revenue_by_branch = {}
    if user["role"] == "super_admin":
        all_bookings = await db.bookings.find({}, {"_id": 0}).to_list(10000)
        for b in all_bookings:
            branch = b.get("branch", "Unknown")
            revenue_by_branch[branch] = revenue_by_branch.get(branch, 0) + b.get("total_paid", 0)
    
    # Trip occupancy
    trips = await db.trips.find({"status": "Open"}, {"_id": 0}).to_list(1000)
    trip_occupancy = []
    for trip in trips:
        occupied = trip.get("seat_quota", 0) - trip.get("seats_remaining", 0)
        trip_occupancy.append({
            "trip_code": trip.get("trip_code"),
            "package_name": trip.get("package_name"),
            "occupied": occupied,
            "total": trip.get("seat_quota", 0),
            "percentage": (occupied / trip.get("seat_quota", 1)) * 100
        })
    
    # Top performing sales
    sales_performance = []
    sales_users = await db.users.find({**branch_filter, "role": "sales"}, {"_id": 0}).to_list(100)
    for sales in sales_users:
        sales_bookings = await db.bookings.count_documents({**branch_filter, "sales_id": sales["id"]})
        sales_revenue = sum(b.get("total_paid", 0) for b in await db.bookings.find({**branch_filter, "sales_id": sales["id"]}, {"_id": 0}).to_list(1000))
        sales_performance.append({
            "name": sales["full_name"],
            "bookings": sales_bookings,
            "revenue": sales_revenue
        })
    sales_performance.sort(key=lambda x: x["revenue"], reverse=True)
    
    # Lead sources
    lead_sources = {}
    for source in ["Meta Ads", "TikTok", "Referral", "WhatsApp"]:
        lead_sources[source] = await db.leads.count_documents({**branch_filter, "source": source})
    
    # Pending approvals
    pending_payments = await db.payments.count_documents({"approval_status": "Pending"})
    
    # Documents H-30 alert
    h30_alerts = []
    for trip in trips:
        dep_date = datetime.fromisoformat(trip["departure_date"].replace("Z", "+00:00")) if "T" in trip["departure_date"] else datetime.strptime(trip["departure_date"], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        days_until = (dep_date - now).days
        if days_until <= 30:
            trip_bookings = await db.bookings.find({"trip_id": trip["id"]}, {"_id": 0}).to_list(1000)
            for booking in trip_bookings:
                doc = await db.documents.find_one({"booking_id": booking["id"]}, {"_id": 0})
                if doc and not all([doc.get("passport"), doc.get("ktp"), doc.get("photo"), doc.get("vaccination")]):
                    customer = await db.customers.find_one({"id": booking["customer_id"]}, {"_id": 0})
                    h30_alerts.append({
                        "customer_name": customer["full_name"] if customer else "Unknown",
                        "trip": trip["package_name"],
                        "days_until_departure": days_until,
                        "booking_id": booking["id"]
                    })
    
    return {
        "leads": {
            "total": total_leads,
            "this_month": leads_this_month,
            "by_status": leads_by_status,
            "conversion_rate": round(conversion_rate, 2)
        },
        "bookings": {
            "total": total_bookings,
            "revenue": total_revenue,
            "outstanding": outstanding
        },
        "revenue_by_branch": revenue_by_branch,
        "trip_occupancy": trip_occupancy[:5],
        "sales_performance": sales_performance[:5],
        "lead_sources": lead_sources,
        "pending_payments": pending_payments,
        "h30_alerts": h30_alerts[:10]
    }

# ================== BRANCHES ==================
@api_router.get("/branches")
async def get_branches():
    return {
        "branches": [
            {"id": "ccm", "name": "RiDATOUR CCM"},
            {"id": "cinere", "name": "RiDATOUR Terrace Cinere"},
            {"id": "makassar", "name": "RiDATOUR Makassar"}
        ]
    }

# ================== SEED DATA ==================
@api_router.post("/seed")
async def seed_data():
    # Create super admin
    admin = await db.users.find_one({"email": "admin@ridatour.com"})
    if not admin:
        admin_dict = {
            "id": str(uuid.uuid4()),
            "email": "admin@ridatour.com",
            "password": hash_password("admin123"),
            "full_name": "Super Admin",
            "role": "super_admin",
            "branch": None,
            "phone": "+6281234567890",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_dict)
    
    return {"message": "Seed data created", "admin_email": "admin@ridatour.com", "admin_password": "admin123"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    try:
        init_storage()
    except Exception as e:
        logger.error(f"Storage init failed on startup: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
