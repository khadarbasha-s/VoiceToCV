from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import UserProfile
from jobs.models import Recruiter

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('user_type', 'phone', 'company_name', 'company_website', 'industry')

class UserSerializer(serializers.ModelSerializer):
    user_profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'user_profile')

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)
    user_type = serializers.ChoiceField(choices=['employee', 'company'], required=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    
    # Company-specific fields
    company_name = serializers.CharField(required=False, allow_blank=True)
    company_website = serializers.URLField(required=False, allow_blank=True)
    industry = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 
                 'user_type', 'phone', 'company_name', 'company_website', 'industry')

    def create(self, validated_data):
        # Extract profile data
        user_type = validated_data.pop('user_type')
        phone = validated_data.pop('phone', '')
        company_name = validated_data.pop('company_name', '')
        company_website = validated_data.pop('company_website', '')
        industry = validated_data.pop('industry', '')
        
        # Create user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Create UserProfile
        user_profile = UserProfile.objects.create(
            user=user,
            user_type=user_type,
            phone=phone,
            company_name=company_name,
            company_website=company_website,
            industry=industry
        )
        
        # If company, also create Recruiter profile
        if user_type == 'company':
            Recruiter.objects.create(
                user=user,
                company_name=company_name or user.username,
                company_website=company_website,
                industry=industry,
                phone=phone
            )
        
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Incorrect Credentials")
