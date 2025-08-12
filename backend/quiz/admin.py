from django.contrib import admin
from .models import Subject, Question, Choice

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 2

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "subject", "difficulty", "created_at")
    list_filter = ("subject", "difficulty")
    search_fields = ("text",)
    inlines = [ChoiceInline]

admin.site.register(Subject)
