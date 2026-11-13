from rest_framework import permissions

class IsCoupleMember(permissions.BasePermission):
    """
    Permission stricte assurant que l'utilisateur connecté appartient bien à un couple actif.
    """
    message = "Vous devez faire partie d'un couple pour accéder à cette ressource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return hasattr(request.user, 'couple_membership') and request.user.couple_membership is not None

    def has_object_permission(self, request, view, obj):
        if not hasattr(request.user, 'couple_membership'):
            return False
        user_couple = request.user.couple_membership.couple
        
        # Check if the object has a couple attribute
        if hasattr(obj, 'couple'):
            return obj.couple_id == user_couple.id
        elif hasattr(obj, 'conversation') and hasattr(obj.conversation, 'couple'):
            return obj.conversation.couple_id == user_couple.id
        elif hasattr(obj, 'flame') and hasattr(obj.flame, 'couple'):
            return obj.flame.couple_id == user_couple.id
        return False

