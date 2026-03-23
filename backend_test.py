#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timezone

class RiDATOURAPITester:
    def __init__(self, base_url="https://hajj-ops-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test data storage
        self.created_lead_id = None
        self.created_customer_id = None
        self.created_trip_id = None
        self.created_booking_id = None
        self.created_payment_id = None

    def log_result(self, test_name, success, response_data=None, error_msg=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
            if response_data:
                print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
        else:
            self.failed_tests.append({"test": test_name, "error": error_msg})
            print(f"❌ {test_name} - FAILED")
            if error_msg:
                print(f"   Error: {error_msg}")

    def make_request(self, method, endpoint, data=None, files=None):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if files:
            headers.pop('Content-Type', None)  # Let requests set it for multipart
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, headers=headers, files=files, data=data, timeout=30)
                else:
                    response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except Exception as e:
            return None, str(e)

    def test_seed_data(self):
        """Test seed endpoint to create admin user"""
        print("\n🔧 Testing seed data creation...")
        response = self.make_request('POST', 'seed')
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("Seed Data Creation", True, data)
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_msg += f", Body: {response.text}"
                except:
                    pass
            self.log_result("Seed Data Creation", False, error_msg=error_msg)
            return False

    def test_login(self):
        """Test login with admin credentials"""
        print("\n🔐 Testing authentication...")
        login_data = {
            "email": "admin@ridatour.com",
            "password": "admin123"
        }
        
        response = self.make_request('POST', 'auth/login', login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.token = data.get('access_token')
            self.user_id = data.get('user', {}).get('id')
            self.log_result("Admin Login", True, {"token_received": bool(self.token)})
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_msg += f", Body: {response.text}"
                except:
                    pass
            self.log_result("Admin Login", False, error_msg=error_msg)
            return False

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        print("\n📊 Testing dashboard stats...")
        response = self.make_request('GET', 'dashboard/stats')
        
        if response and response.status_code == 200:
            data = response.json()
            required_keys = ['leads', 'bookings', 'lead_sources']
            has_required = all(key in data for key in required_keys)
            self.log_result("Dashboard Stats", has_required, data)
            return has_required
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Dashboard Stats", False, error_msg=error_msg)
            return False

    def test_leads_crud(self):
        """Test leads CRUD operations"""
        print("\n👥 Testing leads management...")
        
        # Create lead
        lead_data = {
            "name": "Test Lead",
            "phone": "+6281234567890",
            "source": "Meta Ads",
            "campaign_name": "Test Campaign",
            "branch": "RiDATOUR CCM",
            "status": "New",
            "estimated_departure": "2026-06-01",
            "budget_range": "30-40 Juta",
            "notes": "Test lead for API testing"
        }
        
        response = self.make_request('POST', 'leads', lead_data)
        if response and response.status_code == 200:
            data = response.json()
            self.created_lead_id = data.get('id')
            self.log_result("Create Lead", True, {"lead_id": self.created_lead_id})
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Create Lead", False, error_msg=error_msg)
            return False
        
        # Get leads
        response = self.make_request('GET', 'leads')
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("Get Leads", True, {"count": len(data)})
        else:
            self.log_result("Get Leads", False, error_msg=f"Status: {response.status_code if response else 'No response'}")
        
        # Update lead
        if self.created_lead_id:
            update_data = {"status": "Contacted", "notes": "Updated via API test"}
            response = self.make_request('PUT', f'leads/{self.created_lead_id}', update_data)
            if response and response.status_code == 200:
                self.log_result("Update Lead", True)
            else:
                self.log_result("Update Lead", False, error_msg=f"Status: {response.status_code if response else 'No response'}")
        
        return True

    def test_customers_crud(self):
        """Test customers CRUD operations"""
        print("\n🧑‍🤝‍🧑 Testing customers management...")
        
        # Create customer
        customer_data = {
            "full_name": "Test Customer",
            "nik": "1234567890123456",
            "passport_number": "A12345678",
            "passport_expiry": "2030-12-31",
            "birth_date": "1990-01-01",
            "phone": "+6281234567891",
            "email": "test@customer.com",
            "city": "Jakarta",
            "branch": "RiDATOUR CCM",
            "notes": "Test customer for API testing"
        }
        
        response = self.make_request('POST', 'customers', customer_data)
        if response and response.status_code == 200:
            data = response.json()
            self.created_customer_id = data.get('id')
            self.log_result("Create Customer", True, {"customer_id": self.created_customer_id})
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Create Customer", False, error_msg=error_msg)
            return False
        
        # Get customers
        response = self.make_request('GET', 'customers')
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("Get Customers", True, {"count": len(data)})
        else:
            self.log_result("Get Customers", False, error_msg=f"Status: {response.status_code if response else 'No response'}")
        
        return True

    def test_trips_crud(self):
        """Test trips CRUD operations"""
        print("\n✈️ Testing trips management...")
        
        # Create trip
        trip_data = {
            "trip_code": "UMR-TEST-2026-01",
            "package_name": "Test Umrah Package",
            "departure_date": "2026-06-01",
            "return_date": "2026-06-15",
            "airline": "Garuda Indonesia",
            "hotel_mecca": "Test Hotel Mecca",
            "hotel_madina": "Test Hotel Madina",
            "seat_quota": 45,
            "tour_leader": "Test Tour Leader",
            "price": 35000000,
            "status": "Open",
            "description": "Test trip for API testing"
        }
        
        response = self.make_request('POST', 'trips', trip_data)
        if response and response.status_code == 200:
            data = response.json()
            self.created_trip_id = data.get('id')
            self.log_result("Create Trip", True, {"trip_id": self.created_trip_id})
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Create Trip", False, error_msg=error_msg)
            return False
        
        # Get trips
        response = self.make_request('GET', 'trips')
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("Get Trips", True, {"count": len(data)})
        else:
            self.log_result("Get Trips", False, error_msg=f"Status: {response.status_code if response else 'No response'}")
        
        return True

    def test_bookings_crud(self):
        """Test bookings CRUD operations"""
        print("\n📋 Testing bookings management...")
        
        if not self.created_customer_id or not self.created_trip_id:
            self.log_result("Create Booking", False, error_msg="Missing customer or trip ID")
            return False
        
        # Create booking
        booking_data = {
            "customer_id": self.created_customer_id,
            "trip_id": self.created_trip_id,
            "sales_id": self.user_id,
            "branch": "RiDATOUR CCM",
            "package_price": 35000000,
            "down_payment": 10000000,
            "notes": "Test booking for API testing"
        }
        
        response = self.make_request('POST', 'bookings', booking_data)
        if response and response.status_code == 200:
            data = response.json()
            self.created_booking_id = data.get('id')
            self.log_result("Create Booking", True, {"booking_id": self.created_booking_id})
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_msg += f", Body: {response.text}"
                except:
                    pass
            self.log_result("Create Booking", False, error_msg=error_msg)
            return False
        
        # Get bookings
        response = self.make_request('GET', 'bookings')
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("Get Bookings", True, {"count": len(data)})
        else:
            self.log_result("Get Bookings", False, error_msg=f"Status: {response.status_code if response else 'No response'}")
        
        return True

    def test_payments_crud(self):
        """Test payments CRUD operations"""
        print("\n💳 Testing payments management...")
        
        if not self.created_booking_id:
            self.log_result("Create Payment", False, error_msg="Missing booking ID")
            return False
        
        # Create payment
        payment_data = {
            "booking_id": self.created_booking_id,
            "amount": 5000000,
            "method": "Transfer",
            "notes": "Test payment for API testing"
        }
        
        response = self.make_request('POST', 'payments', payment_data)
        if response and response.status_code == 200:
            data = response.json()
            self.created_payment_id = data.get('id')
            self.log_result("Create Payment", True, {"payment_id": self.created_payment_id})
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Create Payment", False, error_msg=error_msg)
            return False
        
        # Get payments
        response = self.make_request('GET', 'payments')
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("Get Payments", True, {"count": len(data)})
        else:
            self.log_result("Get Payments", False, error_msg=f"Status: {response.status_code if response else 'No response'}")
        
        # Test payment approval
        if self.created_payment_id:
            response = self.make_request('PUT', f'payments/{self.created_payment_id}/approve')
            if response and response.status_code == 200:
                self.log_result("Approve Payment", True)
            else:
                self.log_result("Approve Payment", False, error_msg=f"Status: {response.status_code if response else 'No response'}")
        
        return True

    def test_documents(self):
        """Test documents management"""
        print("\n📄 Testing documents management...")
        
        # Get documents
        response = self.make_request('GET', 'documents')
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("Get Documents", True, {"count": len(data)})
        else:
            self.log_result("Get Documents", False, error_msg=f"Status: {response.status_code if response else 'No response'}")
        
        # Test document update if we have a booking
        if self.created_booking_id:
            doc_update = {
                "passport": True,
                "ktp": True,
                "photo": True,
                "vaccination": False,
                "visa_status": "Pending"
            }
            response = self.make_request('PUT', f'documents/{self.created_booking_id}', doc_update)
            if response and response.status_code == 200:
                self.log_result("Update Document", True)
            else:
                self.log_result("Update Document", False, error_msg=f"Status: {response.status_code if response else 'No response'}")
        
        return True

    def test_users_management(self):
        """Test users management"""
        print("\n👤 Testing users management...")
        
        # Get users
        response = self.make_request('GET', 'users')
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("Get Users", True, {"count": len(data)})
        else:
            self.log_result("Get Users", False, error_msg=f"Status: {response.status_code if response else 'No response'}")
        
        # Get current user
        response = self.make_request('GET', 'auth/me')
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("Get Current User", True, {"role": data.get('role')})
        else:
            self.log_result("Get Current User", False, error_msg=f"Status: {response.status_code if response else 'No response'}")
        
        return True

    def test_branches(self):
        """Test branches endpoint"""
        print("\n🏢 Testing branches...")
        
        response = self.make_request('GET', 'branches')
        if response and response.status_code == 200:
            data = response.json()
            branches = data.get('branches', [])
            expected_branches = ['RiDATOUR CCM', 'RiDATOUR Terrace Cinere', 'RiDATOUR Makassar']
            has_all_branches = all(any(b['name'] == expected for b in branches) for expected in expected_branches)
            self.log_result("Get Branches", has_all_branches, {"branches": len(branches)})
        else:
            self.log_result("Get Branches", False, error_msg=f"Status: {response.status_code if response else 'No response'}")
        
        return True

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting RiDATOUR API Testing...")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        if not self.test_seed_data():
            print("❌ Seed data creation failed - stopping tests")
            return False
        
        if not self.test_login():
            print("❌ Login failed - stopping tests")
            return False
        
        # Core functionality tests
        self.test_dashboard_stats()
        self.test_branches()
        self.test_users_management()
        self.test_leads_crud()
        self.test_customers_crud()
        self.test_trips_crud()
        self.test_bookings_crud()
        self.test_payments_crud()
        self.test_documents()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for failed in self.failed_tests:
                print(f"  - {failed['test']}: {failed['error']}")
        
        return len(self.failed_tests) == 0

def main():
    tester = RiDATOURAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())