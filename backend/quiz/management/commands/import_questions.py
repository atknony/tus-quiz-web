import json
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from quiz.models import Subject, Question, Choice

DIFFICULTY_MAP = {
    "easy": 1,
    "medium": 2,
    "hard": 3,
    # Türkçe ihtimaller:
    "kolay": 1,
    "orta": 2,
    "zor": 3,
}

LETTER_TO_INDEX = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4}

class Command(BaseCommand):
    help = "Import questions from a JSON file into Subject/Question/Choice models."

    def add_arguments(self, parser):
        parser.add_argument("json_path", type=str, help="Path to JSON file (array of question objects).")
        parser.add_argument("--update", action="store_true", help="If external_id exists, update the record instead of skipping.")
        parser.add_argument("--subject-fallback", type=str, default="Genel", help="Default subject if 'category' is missing.")

    def handle(self, *args, **options):
        json_path = Path(options["json_path"])
        if not json_path.exists():
            raise CommandError(f"File not found: {json_path}")

        try:
            data = json.loads(json_path.read_text(encoding="utf-8"))
        except Exception as e:
            raise CommandError(f"JSON parse error: {e}")

        # Hem tek obje hem listeyi destekle
        if isinstance(data, dict):
            records = [data]
        elif isinstance(data, list):
            records = data
        else:
            raise CommandError("JSON root must be an object or an array")

        created_q = 0
        updated_q = 0
        skipped_q = 0

        with transaction.atomic():
            for i, item in enumerate(records, start=1):
                # Zorunlu alanlar
                text = (item.get("text") or "").strip()
                if not text:
                    self.stdout.write(self.style.WARNING(f"[{i}] Skipped: empty text"))
                    skipped_q += 1
                    continue

                category_name = (item.get("category") or options["subject_fallback"]).strip()
                subject, _ = Subject.objects.get_or_create(name=category_name)

                difficulty_raw = (item.get("difficulty") or "").strip().lower()
                difficulty = DIFFICULTY_MAP.get(difficulty_raw, 2)  # default medium

                external_id = item.get("id")  # dış kaynak id'si
                explanation = item.get("explanation") or ""

                options_list = item.get("options") or []
                if not isinstance(options_list, list) or len(options_list) == 0:
                    self.stdout.write(self.style.WARNING(f"[{i}] Skipped: options missing/empty"))
                    skipped_q += 1
                    continue

                correct_letter = (item.get("correctAnswer") or "").strip().upper()
                if correct_letter not in LETTER_TO_INDEX:
                    self.stdout.write(self.style.WARNING(f"[{i}] Skipped: correctAnswer invalid: {correct_letter}"))
                    skipped_q += 1
                    continue
                correct_idx = LETTER_TO_INDEX[correct_letter]
                if correct_idx >= len(options_list):
                    self.stdout.write(self.style.WARNING(f"[{i}] Skipped: correctAnswer index out of range"))
                    skipped_q += 1
                    continue

                # Mevcut var mı? external_id üzerinden bak
                q_obj = None
                if external_id is not None:
                    try:
                        q_obj = Question.objects.get(subject=subject, external_id=external_id)
                    except Question.DoesNotExist:
                            q_obj = None

                if q_obj and not options["update"]:
                    skipped_q += 1
                    self.stdout.write(self.style.NOTICE(f"[{i}] Skipped (exists external_id={external_id})"))
                    continue

                if not q_obj:
                    q_obj = Question(subject=subject, external_id=external_id)

                # Alanları güncelle
                q_obj.text = text
                q_obj.explanation = explanation
                q_obj.difficulty = difficulty
                q_obj.save()

                # Seçenekleri sıfırdan kur (update modunda önce temizle)
                if q_obj.choices.exists():
                    q_obj.choices.all().delete()

                for idx, opt_text in enumerate(options_list):
                    Choice.objects.create(
                        question=q_obj,
                        text=str(opt_text).strip(),
                        is_correct=(idx == correct_idx),
                    )

                if options["update"] and external_id is not None:
                    updated_q += 1
                else:
                    created_q += 1

        self.stdout.write(self.style.SUCCESS(f"Import finished. Created={created_q}, Updated={updated_q}, Skipped={skipped_q}"))
