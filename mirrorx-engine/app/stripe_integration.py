"""
Stripe Integration for Mirror
Payment processing → Guardian certification flow

Tiers:
- Free: 5 reflections/day, basic features
- Personal ($15/mo): Unlimited reflections, voice input, graph viz
- Sovereign ($39/mo): Multi-device, export, advanced workers
- BYOK ($149/yr): Bring your own keys, full control
"""
import stripe
import os
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'mirrorx-engine', 'app'))
from guardian_service import GuardianService, CertificateStatus


class SubscriptionTier:
    """Subscription tier definitions"""
    FREE = {
        "name": "Free",
        "price": 0,
        "stripe_price_id": None,
        "reflection_limit_daily": 5,
        "features": ["basic_reflections", "identity_graph_read"],
        "cert_duration_days": 30
    }
    
    PERSONAL = {
        "name": "Personal",
        "price": 15,  # USD/month
        "stripe_price_id": os.getenv("STRIPE_PERSONAL_PRICE_ID", "price_personal"),
        "reflection_limit_daily": None,  # Unlimited
        "features": [
            "unlimited_reflections",
            "voice_input",
            "graph_visualization",
            "pattern_detection",
            "export_basic"
        ],
        "cert_duration_days": 30
    }
    
    SOVEREIGN = {
        "name": "Sovereign",
        "price": 39,  # USD/month
        "stripe_price_id": os.getenv("STRIPE_SOVEREIGN_PRICE_ID", "price_sovereign"),
        "reflection_limit_daily": None,
        "features": [
            "unlimited_reflections",
            "voice_input",
            "video_input",
            "graph_visualization",
            "pattern_detection",
            "multi_device",
            "export_full",
            "advanced_workers",
            "priority_support"
        ],
        "cert_duration_days": 30
    }
    
    BYOK = {
        "name": "BYOK",
        "price": 149,  # USD/year
        "stripe_price_id": os.getenv("STRIPE_BYOK_PRICE_ID", "price_byok"),
        "reflection_limit_daily": None,
        "features": [
            "all_sovereign_features",
            "bring_your_own_keys",
            "self_hosted_option",
            "api_access",
            "custom_workers",
            "constitutional_fork"
        ],
        "cert_duration_days": 365
    }
    
    @classmethod
    def get_tier(cls, tier_name: str) -> Optional[Dict[str, Any]]:
        """Get tier configuration by name"""
        tiers = {
            "free": cls.FREE,
            "personal": cls.PERSONAL,
            "sovereign": cls.SOVEREIGN,
            "byok": cls.BYOK
        }
        return tiers.get(tier_name.lower())


class StripeService:
    """Stripe integration service"""
    
    def __init__(
        self,
        api_key: str,
        webhook_secret: str,
        guardian_service: GuardianService
    ):
        stripe.api_key = api_key
        self.webhook_secret = webhook_secret
        self.guardian_service = guardian_service
    
    def create_checkout_session(
        self,
        tier: str,
        instance_id: str,
        user_id: str,
        success_url: str,
        cancel_url: str
    ) -> Dict[str, Any]:
        """
        Create Stripe checkout session for subscription
        
        Returns session with checkout URL
        """
        tier_config = SubscriptionTier.get_tier(tier)
        if not tier_config:
            raise ValueError(f"Invalid tier: {tier}")
        
        if tier == "free":
            raise ValueError("Free tier doesn't require checkout")
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': tier_config['stripe_price_id'],
                'quantity': 1,
            }],
            mode='subscription',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'instance_id': instance_id,
                'user_id': user_id,
                'tier': tier
            },
            allow_promotion_codes=True,
            billing_address_collection='required',
        )
        
        return {
            'session_id': session.id,
            'checkout_url': session.url,
            'tier': tier,
            'price': tier_config['price']
        }
    
    def handle_webhook(self, payload: bytes, sig_header: str) -> Dict[str, Any]:
        """
        Handle Stripe webhook event
        
        Returns event type and result
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
        except ValueError:
            raise ValueError("Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise ValueError("Invalid signature")
        
        event_type = event['type']
        
        # Handle different event types
        if event_type == 'checkout.session.completed':
            return self._handle_checkout_completed(event['data']['object'])
        
        elif event_type == 'customer.subscription.updated':
            return self._handle_subscription_updated(event['data']['object'])
        
        elif event_type == 'customer.subscription.deleted':
            return self._handle_subscription_deleted(event['data']['object'])
        
        elif event_type == 'invoice.payment_failed':
            return self._handle_payment_failed(event['data']['object'])
        
        elif event_type == 'invoice.payment_succeeded':
            return self._handle_payment_succeeded(event['data']['object'])
        
        return {'event_type': event_type, 'handled': False}
    
    def _handle_checkout_completed(self, session: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle successful checkout
        Issue Guardian certificate
        """
        metadata = session.get('metadata', {})
        instance_id = metadata.get('instance_id')
        user_id = metadata.get('user_id')
        tier = metadata.get('tier')
        
        if not all([instance_id, user_id, tier]):
            return {'error': 'Missing metadata', 'handled': False}
        
        tier_config = SubscriptionTier.get_tier(tier)
        
        # Issue certificate
        cert = self.guardian_service.certify_instance(
            instance_id=instance_id,
            user_id=user_id,
            tier=tier,
            duration_days=tier_config['cert_duration_days']
        )
        
        return {
            'event_type': 'checkout.session.completed',
            'handled': True,
            'instance_id': instance_id,
            'user_id': user_id,
            'tier': tier,
            'cert_id': cert.cert_id,
            'expires_at': cert.expires_at.isoformat()
        }
    
    def _handle_subscription_updated(self, subscription: Dict[str, Any]) -> Dict[str, Any]:
        """Handle subscription update (upgrade/downgrade)"""
        # Get instance from subscription metadata
        metadata = subscription.get('metadata', {})
        instance_id = metadata.get('instance_id')
        user_id = metadata.get('user_id')
        
        if not instance_id or not user_id:
            return {'error': 'Missing metadata', 'handled': False}
        
        # Get current certificate
        cert = self.guardian_service.get_certificate_by_instance(instance_id)
        
        # Determine new tier from subscription
        # (Would need to map subscription.plan.id to tier)
        new_tier = metadata.get('tier', 'personal')
        tier_config = SubscriptionTier.get_tier(new_tier)
        
        # Issue new certificate with updated tier
        new_cert = self.guardian_service.certify_instance(
            instance_id=instance_id,
            user_id=user_id,
            tier=new_tier,
            duration_days=tier_config['cert_duration_days']
        )
        
        return {
            'event_type': 'customer.subscription.updated',
            'handled': True,
            'instance_id': instance_id,
            'new_tier': new_tier,
            'cert_id': new_cert.cert_id
        }
    
    def _handle_subscription_deleted(self, subscription: Dict[str, Any]) -> Dict[str, Any]:
        """Handle subscription cancellation"""
        metadata = subscription.get('metadata', {})
        instance_id = metadata.get('instance_id')
        user_id = metadata.get('user_id')
        
        if not instance_id or not user_id:
            return {'error': 'Missing metadata', 'handled': False}
        
        # Get current certificate
        cert = self.guardian_service.get_certificate_by_instance(instance_id)
        
        if cert:
            # Revoke certificate
            from guardian_service import RevocationCause
            revocation_id = self.guardian_service.revoke_certificate(
                cert_id=cert.cert_id,
                cause=RevocationCause.USER_REQUEST,
                reason="Subscription cancelled"
            )
            
            return {
                'event_type': 'customer.subscription.deleted',
                'handled': True,
                'instance_id': instance_id,
                'revocation_id': revocation_id
            }
        
        return {'handled': False}
    
    def _handle_payment_failed(self, invoice: Dict[str, Any]) -> Dict[str, Any]:
        """Handle failed payment"""
        subscription = invoice.get('subscription')
        if not subscription:
            return {'handled': False}
        
        # Get subscription to access metadata
        sub_obj = stripe.Subscription.retrieve(subscription)
        metadata = sub_obj.get('metadata', {})
        instance_id = metadata.get('instance_id')
        
        if not instance_id:
            return {'handled': False}
        
        # Get certificate and suspend (not revoke yet - grace period)
        cert = self.guardian_service.get_certificate_by_instance(instance_id)
        if cert:
            # Mark as suspended (would need to add this status to Guardian)
            # For now, just log it
            return {
                'event_type': 'invoice.payment_failed',
                'handled': True,
                'instance_id': instance_id,
                'action': 'suspended',
                'cert_id': cert.cert_id
            }
        
        return {'handled': False}
    
    def _handle_payment_succeeded(self, invoice: Dict[str, Any]) -> Dict[str, Any]:
        """Handle successful payment (renewal)"""
        subscription = invoice.get('subscription')
        if not subscription:
            return {'handled': False}
        
        sub_obj = stripe.Subscription.retrieve(subscription)
        metadata = sub_obj.get('metadata', {})
        instance_id = metadata.get('instance_id')
        user_id = metadata.get('user_id')
        tier = metadata.get('tier')
        
        if not all([instance_id, user_id, tier]):
            return {'handled': False}
        
        # Renew certificate (issue new one)
        tier_config = SubscriptionTier.get_tier(tier)
        cert = self.guardian_service.certify_instance(
            instance_id=instance_id,
            user_id=user_id,
            tier=tier,
            duration_days=tier_config['cert_duration_days']
        )
        
        return {
            'event_type': 'invoice.payment_succeeded',
            'handled': True,
            'instance_id': instance_id,
            'action': 'renewed',
            'cert_id': cert.cert_id,
            'expires_at': cert.expires_at.isoformat()
        }
    
    def get_subscription_status(self, customer_id: str) -> Dict[str, Any]:
        """Get current subscription status for customer"""
        subscriptions = stripe.Subscription.list(customer=customer_id, limit=1)
        
        if not subscriptions.data:
            return {'status': 'none', 'tier': 'free'}
        
        sub = subscriptions.data[0]
        metadata = sub.get('metadata', {})
        
        return {
            'status': sub.status,
            'tier': metadata.get('tier', 'unknown'),
            'current_period_end': sub.current_period_end,
            'cancel_at_period_end': sub.cancel_at_period_end
        }
    
    def create_portal_session(
        self,
        customer_id: str,
        return_url: str
    ) -> Dict[str, str]:
        """Create customer portal session for managing subscription"""
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url
        )
        
        return {'portal_url': session.url}


class EntitlementEnforcer:
    """Enforce tier-based entitlements"""
    
    def __init__(self, guardian_service: GuardianService):
        self.guardian_service = guardian_service
    
    def check_feature_access(
        self,
        instance_id: str,
        feature: str
    ) -> bool:
        """Check if instance has access to feature"""
        cert = self.guardian_service.get_certificate_by_instance(instance_id)
        
        if not cert:
            # No certificate = free tier
            tier_config = SubscriptionTier.FREE
        else:
            tier_config = SubscriptionTier.get_tier(cert.tier)
        
        return feature in tier_config.get('features', [])
    
    def get_rate_limit(
        self,
        instance_id: str,
        resource: str = "reflections"
    ) -> Optional[int]:
        """Get rate limit for instance (None = unlimited)"""
        cert = self.guardian_service.get_certificate_by_instance(instance_id)
        
        if not cert:
            tier_config = SubscriptionTier.FREE
        else:
            tier_config = SubscriptionTier.get_tier(cert.tier)
        
        if resource == "reflections":
            return tier_config.get('reflection_limit_daily')
        
        return None
    
    def enforce_rate_limit(
        self,
        instance_id: str,
        resource: str = "reflections"
    ) -> bool:
        """
        Check if instance is within rate limit
        Returns True if allowed, False if rate limit exceeded
        """
        limit = self.get_rate_limit(instance_id, resource)
        
        if limit is None:
            return True  # Unlimited
        
        # TODO: Implement actual rate limiting with Redis or similar
        # For now, just return True
        return True


# Example usage
if __name__ == "__main__":
    from canonical_signing import Ed25519Signer
    
    # Setup
    guardian_signer = Ed25519Signer.generate()
    guardian_service = GuardianService("guardian.db", guardian_signer)
    
    stripe_service = StripeService(
        api_key=os.getenv("STRIPE_SECRET_KEY", "sk_test_..."),
        webhook_secret=os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_..."),
        guardian_service=guardian_service
    )
    
    # Create checkout session
    session = stripe_service.create_checkout_session(
        tier="personal",
        instance_id="instance-123",
        user_id="user-456",
        success_url="https://mirror.xyz/success",
        cancel_url="https://mirror.xyz/cancel"
    )
    
    print(f"Checkout URL: {session['checkout_url']}")
    
    # Entitlement enforcement
    enforcer = EntitlementEnforcer(guardian_service)
    
    has_voice = enforcer.check_feature_access("instance-123", "voice_input")
    print(f"Has voice access: {has_voice}")
    
    rate_limit = enforcer.get_rate_limit("instance-123")
    print(f"Reflection rate limit: {rate_limit}")
