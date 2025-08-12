from rest_framework import serializers
from .models import Subject, Question, Choice

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "text", "is_correct", "question"]

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    subject_name = serializers.ReadOnlyField(source="subject.name")

    class Meta:
        model = Question
        fields = ["id", "subject", "subject_name", "text", "explanation", "difficulty", "created_at", "choices"]

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name"]
