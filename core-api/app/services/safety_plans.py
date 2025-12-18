"""
Safety Plan Service
Manages personalized safety plans for crisis intervention
Includes versioning, emergency contacts, and coping strategies
"""
from typing import Dict, List, Optional
from datetime import datetime
import json
import uuid

from app.db import execute_query, execute_one


class SafetyPlanService:
    """
    Complete safety plan management
    Plans are stored as JSON in safety_events table with category 'safety_plan'
    """

    async def create_safety_plan(
        self,
        identity_id: str,
        plan_data: Dict
    ) -> Dict:
        """
        Create a new safety plan for a user
        Stores as a safety event with severity 'info' and category 'safety_plan_created'
        """
        # Generate plan ID and version
        plan_id = str(uuid.uuid4())
        version = 1

        # Build complete plan structure
        full_plan = {
            "plan_id": plan_id,
            "version": version,
            "identity_id": identity_id,
            "warning_signs": plan_data.get("warning_signs", []),
            "coping_strategies": plan_data.get("coping_strategies", []),
            "emergency_contacts": plan_data.get("emergency_contacts", []),
            "reasons_to_live": plan_data.get("reasons_to_live", []),
            "environment_safety": plan_data.get("environment_safety", {}),
            "professional_contacts": plan_data.get("professional_contacts", []),
            "created_at": datetime.utcnow().isoformat(),
            "last_updated": datetime.utcnow().isoformat()
        }

        # Store in safety_events table
        result = await fetch_one("""
            INSERT INTO safety_events (
                identity_id, category, severity, 
                action_taken, metadata
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
        """, identity_id, "safety_plan_created", "info",
             "User created safety plan", full_plan)

        full_plan["event_id"] = result['id']
        full_plan["stored_at"] = result['created_at'].isoformat()

        return full_plan

    async def get_safety_plan(self, identity_id: str) -> Optional[Dict]:
        """
        Get the current (most recent) safety plan for a user
        """
        result = await fetch_one("""
            SELECT id, metadata, created_at
            FROM safety_events
            WHERE identity_id = $1
            AND category IN ('safety_plan_created', 'safety_plan_updated')
            ORDER BY created_at DESC
            LIMIT 1
        """, identity_id)

        if not result:
            return None

        plan = result['metadata']
        plan["event_id"] = result['id']
        plan["stored_at"] = result['created_at'].isoformat()

        return plan

    async def update_safety_plan(
        self,
        identity_id: str,
        updates: Dict
    ) -> Dict:
        """
        Update existing safety plan
        Creates new version and stores as new event
        """
        # Get current plan
        current_plan = await self.get_safety_plan(identity_id)

        if not current_plan:
            # No existing plan, create new one
            return await self.create_safety_plan(identity_id, updates)

        # Increment version
        new_version = current_plan.get("version", 1) + 1
        plan_id = current_plan.get("plan_id")

        # Merge updates with existing plan
        updated_plan = {
            "plan_id": plan_id,
            "version": new_version,
            "identity_id": identity_id,
            "warning_signs": updates.get("warning_signs", current_plan.get("warning_signs", [])),
            "coping_strategies": updates.get("coping_strategies", current_plan.get("coping_strategies", [])),
            "emergency_contacts": updates.get("emergency_contacts", current_plan.get("emergency_contacts", [])),
            "reasons_to_live": updates.get("reasons_to_live", current_plan.get("reasons_to_live", [])),
            "environment_safety": updates.get("environment_safety", current_plan.get("environment_safety", {})),
            "professional_contacts": updates.get("professional_contacts", current_plan.get("professional_contacts", [])),
            "created_at": current_plan.get("created_at"),  # Keep original creation time
            "last_updated": datetime.utcnow().isoformat()
        }

        # Store updated plan
        result = await fetch_one("""
            INSERT INTO safety_events (
                identity_id, category, severity,
                action_taken, metadata
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
        """, identity_id, "safety_plan_updated", "info",
             f"User updated safety plan to version {new_version}", updated_plan)

        updated_plan["event_id"] = result['id']
        updated_plan["stored_at"] = result['created_at'].isoformat()

        return updated_plan

    async def get_plan_history(self, identity_id: str) -> List[Dict]:
        """
        Get all versions of user's safety plans
        Returns list ordered by version (newest first)
        """
        results = await execute_query("""
            SELECT id, metadata, created_at, action_taken
            FROM safety_events
            WHERE identity_id = $1
            AND category IN ('safety_plan_created', 'safety_plan_updated')
            ORDER BY created_at DESC
        """, identity_id)

        history = []
        for result in results:
            plan = result['metadata']
            plan["event_id"] = result['id']
            plan["stored_at"] = result['created_at'].isoformat()
            plan["action"] = result['action_taken']
            history.append(plan)

        return history

    async def delete_safety_plan(self, identity_id: str) -> bool:
        """
        Delete safety plan (soft delete - marks as deleted)
        Creates deletion event rather than actually removing data
        """
        current_plan = await self.get_safety_plan(identity_id)

        if not current_plan:
            return False

        # Create deletion event
        await fetch_one("""
            INSERT INTO safety_events (
                identity_id, category, severity,
                action_taken, metadata
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        """, identity_id, "safety_plan_deleted", "info",
             "User deleted safety plan",
             {"plan_id": current_plan.get("plan_id"), "deleted_at": datetime.utcnow().isoformat()})

        return True

    # ==================== Emergency Contacts Management ====================

    async def add_contact(
        self,
        identity_id: str,
        contact: Dict
    ) -> Dict:
        """
        Add emergency contact to safety plan
        """
        current_plan = await self.get_safety_plan(identity_id)

        if not current_plan:
            # Create new plan with this contact
            return await self.create_safety_plan(identity_id, {
                "emergency_contacts": [contact]
            })

        # Add contact to existing plan
        contacts = current_plan.get("emergency_contacts", [])

        # Generate contact ID
        contact["id"] = str(uuid.uuid4())
        contact["added_at"] = datetime.utcnow().isoformat()

        contacts.append(contact)

        # Update plan
        updated_plan = await self.update_safety_plan(identity_id, {
            **current_plan,
            "emergency_contacts": contacts
        })

        return contact

    async def update_contact(
        self,
        identity_id: str,
        contact_id: str,
        updates: Dict
    ) -> Optional[Dict]:
        """
        Update specific emergency contact
        """
        current_plan = await self.get_safety_plan(identity_id)

        if not current_plan:
            return None

        contacts = current_plan.get("emergency_contacts", [])

        # Find and update contact
        contact_found = False
        for i, contact in enumerate(contacts):
            if contact.get("id") == contact_id:
                contacts[i] = {**contact, **updates, "updated_at": datetime.utcnow().isoformat()}
                contact_found = True
                break

        if not contact_found:
            return None

        # Update plan
        await self.update_safety_plan(identity_id, {
            **current_plan,
            "emergency_contacts": contacts
        })

        return contacts[i]

    async def delete_contact(
        self,
        identity_id: str,
        contact_id: str
    ) -> bool:
        """
        Remove emergency contact from safety plan
        """
        current_plan = await self.get_safety_plan(identity_id)

        if not current_plan:
            return False

        contacts = current_plan.get("emergency_contacts", [])

        # Remove contact
        updated_contacts = [c for c in contacts if c.get("id") != contact_id]

        if len(updated_contacts) == len(contacts):
            # Contact not found
            return False

        # Update plan
        await self.update_safety_plan(identity_id, {
            **current_plan,
            "emergency_contacts": updated_contacts
        })

        return True

    # ==================== Coping Strategies Management ====================

    async def add_coping_strategy(
        self,
        identity_id: str,
        strategy: Dict
    ) -> Dict:
        """
        Add coping strategy to safety plan
        """
        current_plan = await self.get_safety_plan(identity_id)

        if not current_plan:
            return await self.create_safety_plan(identity_id, {
                "coping_strategies": [strategy]
            })

        strategies = current_plan.get("coping_strategies", [])

        # Generate strategy ID and add metadata
        strategy["id"] = str(uuid.uuid4())
        strategy["added_at"] = datetime.utcnow().isoformat()
        strategy["times_used"] = 0
        strategy["effectiveness_ratings"] = []

        strategies.append(strategy)

        await self.update_safety_plan(identity_id, {
            **current_plan,
            "coping_strategies": strategies
        })

        return strategy

    async def update_strategy(
        self,
        identity_id: str,
        strategy_id: str,
        updates: Dict
    ) -> Optional[Dict]:
        """
        Update coping strategy
        """
        current_plan = await self.get_safety_plan(identity_id)

        if not current_plan:
            return None

        strategies = current_plan.get("coping_strategies", [])

        for i, strategy in enumerate(strategies):
            if strategy.get("id") == strategy_id:
                strategies[i] = {**strategy, **updates, "updated_at": datetime.utcnow().isoformat()}
                
                await self.update_safety_plan(identity_id, {
                    **current_plan,
                    "coping_strategies": strategies
                })
                
                return strategies[i]

        return None

    async def rate_strategy_effectiveness(
        self,
        identity_id: str,
        strategy_id: str,
        rating: int  # 1-5
    ) -> Optional[Dict]:
        """
        Record effectiveness rating for a coping strategy
        Helps user track what works best
        """
        current_plan = await self.get_safety_plan(identity_id)

        if not current_plan:
            return None

        strategies = current_plan.get("coping_strategies", [])

        for i, strategy in enumerate(strategies):
            if strategy.get("id") == strategy_id:
                # Increment usage count
                strategy["times_used"] = strategy.get("times_used", 0) + 1
                
                # Add rating
                ratings = strategy.get("effectiveness_ratings", [])
                ratings.append({
                    "rating": rating,
                    "recorded_at": datetime.utcnow().isoformat()
                })
                strategy["effectiveness_ratings"] = ratings
                
                # Calculate average effectiveness
                avg_rating = sum(r["rating"] for r in ratings) / len(ratings)
                strategy["avg_effectiveness"] = round(avg_rating, 2)
                
                strategies[i] = strategy
                
                await self.update_safety_plan(identity_id, {
                    **current_plan,
                    "coping_strategies": strategies
                })
                
                return strategies[i]

        return None

    # ==================== Plan Statistics ====================

    async def get_plan_stats(self, identity_id: str) -> Dict:
        """
        Get statistics about safety plan usage
        """
        plan = await self.get_safety_plan(identity_id)

        if not plan:
            return {
                "has_plan": False,
                "version": 0,
                "last_updated": None,
                "stats": {}
            }

        # Calculate statistics
        strategies = plan.get("coping_strategies", [])
        contacts = plan.get("emergency_contacts", [])

        total_strategy_uses = sum(s.get("times_used", 0) for s in strategies)
        
        # Get most effective strategies
        rated_strategies = [s for s in strategies if s.get("avg_effectiveness")]
        most_effective = sorted(
            rated_strategies,
            key=lambda s: s.get("avg_effectiveness", 0),
            reverse=True
        )[:3]

        return {
            "has_plan": True,
            "version": plan.get("version", 1),
            "last_updated": plan.get("last_updated"),
            "created_at": plan.get("created_at"),
            "stats": {
                "num_warning_signs": len(plan.get("warning_signs", [])),
                "num_coping_strategies": len(strategies),
                "num_emergency_contacts": len(contacts),
                "num_professional_contacts": len(plan.get("professional_contacts", [])),
                "num_reasons_to_live": len(plan.get("reasons_to_live", [])),
                "total_strategy_uses": total_strategy_uses,
                "most_effective_strategies": [
                    {
                        "action": s.get("action"),
                        "effectiveness": s.get("avg_effectiveness"),
                        "times_used": s.get("times_used", 0)
                    }
                    for s in most_effective
                ]
            }
        }


# Singleton instance
safety_plan_service = SafetyPlanService()
