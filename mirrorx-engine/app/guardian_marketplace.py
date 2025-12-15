"""
Recognition Licensing Marketplace
Guardian licensing system with revenue sharing

Marketplace for Guardians to license their recognition authority.
70% revenue to licensee, 30% to Guardian Council.
"""
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import sqlite3
import hashlib
import json

from canonical_signing import Ed25519Signer


class LicenseType:
    """License tier definitions"""
    BASIC = "basic"  # $500/month - 1000 certs
    PROFESSIONAL = "professional"  # $2000/month - 5000 certs
    ENTERPRISE = "enterprise"  # $10000/month - unlimited


@dataclass
class GuardianLicense:
    """License to operate as Guardian"""
    license_id: str
    guardian_id: str
    guardian_name: str
    license_type: str
    monthly_price: Decimal
    monthly_cert_limit: Optional[int]
    revenue_share_licensee: Decimal  # 0.70
    revenue_share_council: Decimal  # 0.30
    issued_at: str
    expires_at: str
    status: str  # active, suspended, expired
    certification_count: int
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['monthly_price'] = float(self.monthly_price)
        data['revenue_share_licensee'] = float(self.revenue_share_licensee)
        data['revenue_share_council'] = float(self.revenue_share_council)
        return data


@dataclass
class RevenueReport:
    """Monthly revenue report for licensed Guardian"""
    report_id: str
    license_id: str
    guardian_id: str
    reporting_period: str  # YYYY-MM
    certifications_issued: int
    gross_revenue: Decimal
    licensee_share: Decimal  # 70%
    council_share: Decimal  # 30%
    stripe_fees: Decimal
    net_to_licensee: Decimal
    generated_at: str
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        for key in ['gross_revenue', 'licensee_share', 'council_share', 'stripe_fees', 'net_to_licensee']:
            data[key] = float(getattr(self, key))
        return data


class LicenseMarketplace:
    """Marketplace for Guardian licenses"""
    
    def __init__(self, db_path: str = "guardian_marketplace.db"):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        """Initialize marketplace database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Guardian licenses
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS guardian_licenses (
            license_id TEXT PRIMARY KEY,
            guardian_id TEXT NOT NULL,
            guardian_name TEXT NOT NULL,
            license_type TEXT NOT NULL,
            monthly_price REAL NOT NULL,
            monthly_cert_limit INTEGER,
            revenue_share_licensee REAL NOT NULL,
            revenue_share_council REAL NOT NULL,
            issued_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            status TEXT NOT NULL,
            certification_count INTEGER DEFAULT 0,
            UNIQUE(guardian_id)
        )
        """)
        
        # Revenue reports
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS revenue_reports (
            report_id TEXT PRIMARY KEY,
            license_id TEXT NOT NULL,
            guardian_id TEXT NOT NULL,
            reporting_period TEXT NOT NULL,
            certifications_issued INTEGER NOT NULL,
            gross_revenue REAL NOT NULL,
            licensee_share REAL NOT NULL,
            council_share REAL NOT NULL,
            stripe_fees REAL NOT NULL,
            net_to_licensee REAL NOT NULL,
            generated_at TEXT NOT NULL,
            FOREIGN KEY (license_id) REFERENCES guardian_licenses(license_id)
        )
        """)
        
        # License applications
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS license_applications (
            application_id TEXT PRIMARY KEY,
            guardian_name TEXT NOT NULL,
            organization TEXT,
            email TEXT NOT NULL,
            requested_tier TEXT NOT NULL,
            justification TEXT NOT NULL,
            status TEXT NOT NULL,
            applied_at TEXT NOT NULL,
            reviewed_at TEXT,
            reviewed_by TEXT,
            notes TEXT
        )
        """)
        
        conn.commit()
        conn.close()
    
    def apply_for_license(
        self,
        guardian_name: str,
        email: str,
        requested_tier: str,
        justification: str,
        organization: Optional[str] = None
    ) -> str:
        """
        Apply for Guardian license
        
        Returns:
            application_id
        """
        application_id = hashlib.sha256(
            f"{guardian_name}{email}{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
        INSERT INTO license_applications
        (application_id, guardian_name, organization, email, requested_tier, justification, status, applied_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            application_id,
            guardian_name,
            organization,
            email,
            requested_tier,
            justification,
            "pending",
            datetime.utcnow().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        return application_id
    
    def review_application(
        self,
        application_id: str,
        approve: bool,
        reviewer_id: str,
        notes: Optional[str] = None
    ) -> Optional[GuardianLicense]:
        """
        Review license application (requires Guardian Council approval)
        
        Returns:
            GuardianLicense if approved, None if rejected
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get application
        cursor.execute("""
        SELECT guardian_name, organization, requested_tier
        FROM license_applications
        WHERE application_id = ?
        """, (application_id,))
        
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError(f"Application {application_id} not found")
        
        guardian_name, organization, requested_tier = row
        
        # Update application status
        status = "approved" if approve else "rejected"
        cursor.execute("""
        UPDATE license_applications
        SET status = ?, reviewed_at = ?, reviewed_by = ?, notes = ?
        WHERE application_id = ?
        """, (status, datetime.utcnow().isoformat(), reviewer_id, notes, application_id))
        
        license_obj = None
        
        if approve:
            # Issue license
            license_obj = self._issue_license(
                cursor,
                guardian_name,
                requested_tier
            )
        
        conn.commit()
        conn.close()
        
        return license_obj
    
    def _issue_license(
        self,
        cursor,
        guardian_name: str,
        license_type: str
    ) -> GuardianLicense:
        """Issue new Guardian license"""
        # Generate license ID
        license_id = hashlib.sha256(
            f"{guardian_name}{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]
        
        # Generate guardian ID
        guardian_id = f"guardian-{hashlib.sha256(guardian_name.encode()).hexdigest()[:12]}"
        
        # License parameters by tier
        tiers = {
            LicenseType.BASIC: {
                "monthly_price": Decimal("500.00"),
                "monthly_cert_limit": 1000
            },
            LicenseType.PROFESSIONAL: {
                "monthly_price": Decimal("2000.00"),
                "monthly_cert_limit": 5000
            },
            LicenseType.ENTERPRISE: {
                "monthly_price": Decimal("10000.00"),
                "monthly_cert_limit": None  # Unlimited
            }
        }
        
        tier_config = tiers[license_type]
        
        # Create license
        license_obj = GuardianLicense(
            license_id=license_id,
            guardian_id=guardian_id,
            guardian_name=guardian_name,
            license_type=license_type,
            monthly_price=tier_config["monthly_price"],
            monthly_cert_limit=tier_config["monthly_cert_limit"],
            revenue_share_licensee=Decimal("0.70"),
            revenue_share_council=Decimal("0.30"),
            issued_at=datetime.utcnow().isoformat(),
            expires_at=(datetime.utcnow() + timedelta(days=365)).isoformat(),
            status="active",
            certification_count=0
        )
        
        # Store license
        cursor.execute("""
        INSERT INTO guardian_licenses
        (license_id, guardian_id, guardian_name, license_type, monthly_price, monthly_cert_limit,
         revenue_share_licensee, revenue_share_council, issued_at, expires_at, status, certification_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            license_obj.license_id,
            license_obj.guardian_id,
            license_obj.guardian_name,
            license_obj.license_type,
            float(license_obj.monthly_price),
            license_obj.monthly_cert_limit,
            float(license_obj.revenue_share_licensee),
            float(license_obj.revenue_share_council),
            license_obj.issued_at,
            license_obj.expires_at,
            license_obj.status,
            0
        ))
        
        return license_obj
    
    def get_available_licenses(self) -> List[GuardianLicense]:
        """Get all active Guardian licenses in marketplace"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
        SELECT license_id, guardian_id, guardian_name, license_type, monthly_price,
               monthly_cert_limit, revenue_share_licensee, revenue_share_council,
               issued_at, expires_at, status, certification_count
        FROM guardian_licenses
        WHERE status = 'active'
        ORDER BY guardian_name
        """)
        
        licenses = []
        for row in cursor.fetchall():
            licenses.append(GuardianLicense(
                license_id=row[0],
                guardian_id=row[1],
                guardian_name=row[2],
                license_type=row[3],
                monthly_price=Decimal(str(row[4])),
                monthly_cert_limit=row[5],
                revenue_share_licensee=Decimal(str(row[6])),
                revenue_share_council=Decimal(str(row[7])),
                issued_at=row[8],
                expires_at=row[9],
                status=row[10],
                certification_count=row[11]
            ))
        
        conn.close()
        return licenses
    
    def record_certification(
        self,
        license_id: str,
        user_payment_amount: Decimal
    ):
        """
        Record certification issued by licensed Guardian
        
        Args:
            license_id: Guardian license ID
            user_payment_amount: Amount user paid for certification
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Increment certification count
        cursor.execute("""
        UPDATE guardian_licenses
        SET certification_count = certification_count + 1
        WHERE license_id = ?
        """, (license_id,))
        
        # Check limit
        cursor.execute("""
        SELECT monthly_cert_limit, certification_count
        FROM guardian_licenses
        WHERE license_id = ?
        """, (license_id,))
        
        row = cursor.fetchone()
        if row:
            limit, count = row
            if limit is not None and count >= limit:
                # Suspend license (exceeded monthly limit)
                cursor.execute("""
                UPDATE guardian_licenses
                SET status = 'suspended'
                WHERE license_id = ?
                """, (license_id,))
        
        conn.commit()
        conn.close()
    
    def generate_monthly_report(
        self,
        license_id: str,
        reporting_period: str  # YYYY-MM
    ) -> RevenueReport:
        """
        Generate monthly revenue report for licensed Guardian
        
        Args:
            license_id: Guardian license ID
            reporting_period: YYYY-MM format
        
        Returns:
            RevenueReport with revenue breakdown
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get license info
        cursor.execute("""
        SELECT guardian_id, monthly_price, revenue_share_licensee, revenue_share_council, certification_count
        FROM guardian_licenses
        WHERE license_id = ?
        """, (license_id,))
        
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError(f"License {license_id} not found")
        
        guardian_id, monthly_price, share_licensee, share_council, cert_count = row
        
        # Calculate revenue
        # Assume each certification is $15 (Personal tier price)
        avg_cert_price = Decimal("15.00")
        gross_revenue = avg_cert_price * cert_count
        
        # Calculate splits
        licensee_share = gross_revenue * Decimal(str(share_licensee))
        council_share = gross_revenue * Decimal(str(share_council))
        
        # Stripe fees (2.9% + $0.30 per transaction)
        stripe_fees = (gross_revenue * Decimal("0.029")) + (Decimal("0.30") * cert_count)
        
        # Net to licensee
        net_to_licensee = licensee_share - stripe_fees
        
        # Generate report
        report = RevenueReport(
            report_id=hashlib.sha256(
                f"{license_id}{reporting_period}".encode()
            ).hexdigest()[:16],
            license_id=license_id,
            guardian_id=guardian_id,
            reporting_period=reporting_period,
            certifications_issued=cert_count,
            gross_revenue=gross_revenue,
            licensee_share=licensee_share,
            council_share=council_share,
            stripe_fees=stripe_fees,
            net_to_licensee=net_to_licensee,
            generated_at=datetime.utcnow().isoformat()
        )
        
        # Store report
        cursor.execute("""
        INSERT INTO revenue_reports
        (report_id, license_id, guardian_id, reporting_period, certifications_issued,
         gross_revenue, licensee_share, council_share, stripe_fees, net_to_licensee, generated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            report.report_id,
            report.license_id,
            report.guardian_id,
            report.reporting_period,
            report.certifications_issued,
            float(report.gross_revenue),
            float(report.licensee_share),
            float(report.council_share),
            float(report.stripe_fees),
            float(report.net_to_licensee),
            report.generated_at
        ))
        
        # Reset certification count for next month
        cursor.execute("""
        UPDATE guardian_licenses
        SET certification_count = 0
        WHERE license_id = ?
        """, (license_id,))
        
        conn.commit()
        conn.close()
        
        return report
    
    def get_license_analytics(self, guardian_id: str) -> Dict[str, Any]:
        """Get analytics for Guardian's license"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get license info
        cursor.execute("""
        SELECT license_type, certification_count, monthly_cert_limit, status
        FROM guardian_licenses
        WHERE guardian_id = ?
        """, (guardian_id,))
        
        row = cursor.fetchone()
        if not row:
            conn.close()
            return {}
        
        license_type, cert_count, cert_limit, status = row
        
        # Get historical reports
        cursor.execute("""
        SELECT reporting_period, certifications_issued, net_to_licensee
        FROM revenue_reports
        WHERE guardian_id = ?
        ORDER BY reporting_period DESC
        LIMIT 12
        """, (guardian_id,))
        
        monthly_history = [
            {
                "period": row[0],
                "certifications": row[1],
                "revenue": float(row[2])
            }
            for row in cursor.fetchall()
        ]
        
        # Calculate totals
        total_certs = sum(m["certifications"] for m in monthly_history)
        total_revenue = sum(m["revenue"] for m in monthly_history)
        
        conn.close()
        
        return {
            "license_type": license_type,
            "status": status,
            "current_month_certifications": cert_count,
            "monthly_limit": cert_limit,
            "limit_utilization": (cert_count / cert_limit * 100) if cert_limit else 0,
            "total_certifications": total_certs,
            "total_revenue": total_revenue,
            "monthly_history": monthly_history
        }


# Example usage
if __name__ == "__main__":
    marketplace = LicenseMarketplace()
    
    # Apply for license
    app_id = marketplace.apply_for_license(
        guardian_name="TechCorp Guardian",
        email="guardian@techcorp.com",
        requested_tier=LicenseType.PROFESSIONAL,
        justification="We operate a privacy-focused tech consultancy and want to offer Mirror certification to our clients.",
        organization="TechCorp Inc."
    )
    
    print(f"Application submitted: {app_id}")
    
    # Review application (requires Guardian Council vote in practice)
    license_obj = marketplace.review_application(
        application_id=app_id,
        approve=True,
        reviewer_id="guardian-founder-001",
        notes="Approved by Guardian Council vote 4-0"
    )
    
    if license_obj:
        print(f"\nLicense issued: {license_obj.license_id}")
        print(f"Guardian ID: {license_obj.guardian_id}")
        print(f"Monthly price: ${license_obj.monthly_price}")
        print(f"Cert limit: {license_obj.monthly_cert_limit}")
        print(f"Revenue share: {license_obj.revenue_share_licensee * 100}% licensee, {license_obj.revenue_share_council * 100}% council")
        
        # Simulate certifications
        for i in range(100):
            marketplace.record_certification(
                license_id=license_obj.license_id,
                user_payment_amount=Decimal("15.00")
            )
        
        # Generate report
        report = marketplace.generate_monthly_report(
            license_id=license_obj.license_id,
            reporting_period="2024-01"
        )
        
        print(f"\nMonthly Report for {report.reporting_period}")
        print(f"Certifications issued: {report.certifications_issued}")
        print(f"Gross revenue: ${report.gross_revenue}")
        print(f"Licensee share (70%): ${report.licensee_share}")
        print(f"Council share (30%): ${report.council_share}")
        print(f"Stripe fees: ${report.stripe_fees}")
        print(f"Net to licensee: ${report.net_to_licensee}")
        
        # Get analytics
        analytics = marketplace.get_license_analytics(license_obj.guardian_id)
        print(f"\nAnalytics:")
        print(f"Total certifications: {analytics['total_certifications']}")
        print(f"Total revenue: ${analytics['total_revenue']}")
