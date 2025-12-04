from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .serializers import SignupSerializer, LoginSerializer, UserSerializer

@api_view(['POST'])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        
        # Get user profile data
        user_serializer = UserSerializer(user)
        
        return Response({
            'token': token.key,
            'user': user_serializer.data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data
        token, created = Token.objects.get_or_create(user=user)
        
        # Get user profile data
        user_serializer = UserSerializer(user)
        
        return Response({
            'token': token.key,
            'user': user_serializer.data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
