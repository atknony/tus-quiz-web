# backend/quiz/views.py
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Subject, Question, Choice
from .serializers import SubjectSerializer, QuestionSerializer, ChoiceSerializer
import random

class SubjectViewSet(ModelViewSet):
    queryset = Subject.objects.all().order_by("name")
    serializer_class = SubjectSerializer

class ChoiceViewSet(ModelViewSet):
    queryset = Choice.objects.select_related("question").order_by("id")
    serializer_class = ChoiceSerializer

class QuestionViewSet(ModelViewSet):
    queryset = Question.objects.select_related("subject").prefetch_related("choices").order_by("-id")
    serializer_class = QuestionSerializer

    # 'random' kelimesi pk sanılmasın diye: pk sadece sayı olsun
    lookup_value_regex = r"\d+"

    @action(detail=False, methods=["get"], url_path="random")
    def random(self, request):
        n = int(request.query_params.get("n", 10))
        subject = request.query_params.get("subject")
        difficulty = request.query_params.get("difficulty")

        qs = self.get_queryset()
        if subject:
            qs = qs.filter(subject_id=subject)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)

        ids = list(qs.values_list("id", flat=True))
        if not ids:
            return Response({"results": [], "count": 0})

        pick = random.sample(ids, k=min(n, len(ids)))
        data = QuestionSerializer(qs.filter(id__in=pick), many=True).data
        return Response({"results": data, "count": len(data)})
