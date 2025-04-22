import {
  users,
  type User,
  type InsertUser,
  questions,
  type Question,
  type InsertQuestion,
  games,
  type Game,
  type InsertGame,
} from "@shared/schema";

// Sample questions for in-memory storage
const sampleQuestions: Question[] = [
  {
    id: 1,
    text: "Which of the following is NOT a characteristic of Parkinson's disease?",
    options: [
      "Resting tremor",
      "Bradykinesia",
      "Increased deep tendon reflexes",
      "Postural instability",
      "Cogwheel rigidity"
    ],
    correctAnswer: "C",
    explanation: "Parkinson's disease is characterized by resting tremor, bradykinesia, rigidity (including cogwheel rigidity), and postural instability. Increased deep tendon reflexes is typically seen in upper motor neuron lesions, not in Parkinson's disease, which usually has normal reflexes.",
    category: "Neurology",
    difficulty: "medium"
  },
  {
    id: 2,
    text: "Which of the following antibiotics is most appropriate for treating pseudomembranous colitis caused by Clostridium difficile?",
    options: [
      "Ciprofloxacin",
      "Vancomycin",
      "Gentamicin",
      "Ceftriaxone",
      "Azithromycin"
    ],
    correctAnswer: "B",
    explanation: "Vancomycin is one of the first-line treatments for C. difficile infections, along with metronidazole. Vancomycin is particularly effective for severe cases. The other antibiotics listed are not effective against C. difficile and may actually contribute to C. difficile overgrowth by disrupting the normal gut flora.",
    category: "Infectious Diseases",
    difficulty: "easy"
  },
  {
    id: 3,
    text: "A 65-year-old patient presents with dyspnea, orthopnea, and bilateral lower extremity edema. Echocardiogram shows an ejection fraction of 25%. Which of the following medications would be CONTRAINDICATED in this patient?",
    options: [
      "Lisinopril",
      "Metoprolol",
      "Verapamil",
      "Furosemide",
      "Spironolactone"
    ],
    correctAnswer: "C",
    explanation: "Verapamil, a non-dihydropyridine calcium channel blocker, has negative inotropic effects and is contraindicated in heart failure with reduced ejection fraction. The other medications listed (ACE inhibitor, beta-blocker, loop diuretic, and aldosterone antagonist) are all part of guideline-directed medical therapy for heart failure with reduced ejection fraction.",
    category: "Cardiology",
    difficulty: "medium"
  },
  {
    id: 4,
    text: "Which vitamin deficiency is most strongly associated with Wernicke-Korsakoff syndrome?",
    options: [
      "Vitamin B1 (Thiamine)",
      "Vitamin B6 (Pyridoxine)",
      "Vitamin B9 (Folate)",
      "Vitamin B12 (Cobalamin)",
      "Vitamin C (Ascorbic acid)"
    ],
    correctAnswer: "A",
    explanation: "Wernicke-Korsakoff syndrome is caused by thiamine (vitamin B1) deficiency, most commonly seen in chronic alcoholics due to poor nutrition and impaired thiamine absorption. The syndrome consists of Wernicke's encephalopathy (confusion, ataxia, and ophthalmoplegia) and Korsakoff psychosis (severe anterograde and retrograde amnesia).",
    category: "Neurology",
    difficulty: "easy"
  },
  {
    id: 5,
    text: "In a patient with suspected acute pulmonary embolism, which laboratory finding would be most specific for this diagnosis?",
    options: [
      "Elevated D-dimer",
      "Elevated troponin",
      "Elevated BNP",
      "Elevated lactate",
      "Elevated procalcitonin"
    ],
    correctAnswer: "A",
    explanation: "While D-dimer has high sensitivity but poor specificity for PE (as it can be elevated in many conditions), it is still the most specific of the listed options for PE. Elevated troponin indicates myocardial injury, elevated BNP indicates heart failure, elevated lactate indicates tissue hypoperfusion, and elevated procalcitonin indicates bacterial infection. None of these is specifically associated with PE.",
    category: "Pulmonology",
    difficulty: "medium"
  },
  {
    id: 6,
    text: "Which of the following is the most common cause of community-acquired pneumonia in adults?",
    options: [
      "Streptococcus pneumoniae",
      "Haemophilus influenzae",
      "Mycoplasma pneumoniae",
      "Klebsiella pneumoniae",
      "Legionella pneumophila"
    ],
    correctAnswer: "A",
    explanation: "Streptococcus pneumoniae (pneumococcus) is the most common cause of community-acquired pneumonia in adults, accounting for approximately 30-35% of cases. The other pathogens listed are also causes of community-acquired pneumonia but are less common than S. pneumoniae.",
    category: "Infectious Diseases",
    difficulty: "easy"
  },
  {
    id: 7,
    text: "A 50-year-old patient presents with fatigue, weight loss, and a hemoglobin of 9.5 g/dL. Laboratory findings include a mean corpuscular volume (MCV) of 65 fL and a ferritin of 10 ng/mL. What is the most likely diagnosis?",
    options: [
      "Thalassemia",
      "Iron deficiency anemia",
      "Anemia of chronic disease",
      "Folate deficiency anemia",
      "Vitamin B12 deficiency anemia"
    ],
    correctAnswer: "B",
    explanation: "The combination of microcytic anemia (low MCV) and low ferritin is diagnostic of iron deficiency anemia. Thalassemia would present with microcytic anemia but normal or elevated ferritin. Anemia of chronic disease typically presents with normocytic anemia and normal or elevated ferritin. Folate and B12 deficiencies cause macrocytic anemia (high MCV).",
    category: "Hematology",
    difficulty: "medium"
  },
  {
    id: 8,
    text: "Which of the following ECG findings is most characteristic of hyperkalemia?",
    options: [
      "Prolonged QT interval",
      "Tall, peaked T waves",
      "Prominent U waves",
      "ST-segment elevation",
      "New-onset left bundle branch block"
    ],
    correctAnswer: "B",
    explanation: "Tall, peaked T waves are the earliest and most characteristic ECG finding in hyperkalemia. As hyperkalemia worsens, the ECG may show widened QRS complexes, prolonged PR interval, flattened P waves, and eventually sine wave pattern and asystole. Prolonged QT interval is seen in hypokalemia, hypocalcemia, and certain medications. Prominent U waves are seen in hypokalemia. ST-segment elevation suggests myocardial infarction or pericarditis.",
    category: "Cardiology",
    difficulty: "easy"
  },
  {
    id: 9,
    text: "A 35-year-old female presents with fatigue, weight gain, cold intolerance, and constipation. Laboratory testing is most likely to show which of the following?",
    options: [
      "Elevated TSH, decreased free T4",
      "Decreased TSH, elevated free T4",
      "Elevated TSH, elevated free T4",
      "Decreased TSH, decreased free T4",
      "Normal TSH, decreased free T4"
    ],
    correctAnswer: "A",
    explanation: "The patient's symptoms (fatigue, weight gain, cold intolerance, constipation) are classic for hypothyroidism. Primary hypothyroidism, which is the most common form, is characterized by elevated TSH (due to lack of negative feedback) and decreased free T4. The other patterns listed would indicate different thyroid disorders: B would indicate hyperthyroidism, C would suggest TSH-secreting pituitary adenoma, D would suggest central (secondary) hypothyroidism, and E would be unusual.",
    category: "Endocrinology",
    difficulty: "easy"
  },
  {
    id: 10,
    text: "Which of the following antihypertensive medications is most likely to cause a dry cough as a side effect?",
    options: [
      "Amlodipine",
      "Lisinopril",
      "Hydrochlorothiazide",
      "Metoprolol",
      "Losartan"
    ],
    correctAnswer: "B",
    explanation: "Lisinopril is an ACE inhibitor, and ACE inhibitors are notorious for causing a dry, persistent cough in about 5-35% of patients. This is due to the accumulation of bradykinin, which would normally be degraded by ACE. Amlodipine (calcium channel blocker), hydrochlorothiazide (thiazide diuretic), metoprolol (beta-blocker), and losartan (angiotensin receptor blocker) do not commonly cause cough. In fact, ARBs like losartan are often substituted for ACE inhibitors in patients who develop a cough.",
    category: "Pharmacology",
    difficulty: "easy"
  },
  {
    id: 11,
    text: "Which of the following tumor markers is most specific for hepatocellular carcinoma?",
    options: [
      "Alpha-fetoprotein (AFP)",
      "Carcinoembryonic antigen (CEA)",
      "CA 19-9",
      "CA 125",
      "Prostate-specific antigen (PSA)"
    ],
    correctAnswer: "A",
    explanation: "Alpha-fetoprotein (AFP) is the primary tumor marker used for hepatocellular carcinoma (HCC). While it is not perfectly specific (it can be elevated in other conditions like cirrhosis, hepatitis, and germ cell tumors), it is the most specific of the listed options for HCC. CEA is primarily associated with colorectal cancer, CA 19-9 with pancreatic cancer, CA 125 with ovarian cancer, and PSA with prostate cancer.",
    category: "Oncology",
    difficulty: "medium"
  },
  {
    id: 12,
    text: "A 60-year-old male with a history of hypertension and diabetes presents with sudden onset of severe headache, nausea, vomiting, and neck stiffness. Physical examination reveals nuchal rigidity. Which imaging study would be most appropriate to confirm the suspected diagnosis?",
    options: [
      "MRI of the brain with contrast",
      "CT scan of the brain without contrast",
      "CT angiography of the brain",
      "MR venography",
      "Conventional cerebral angiography"
    ],
    correctAnswer: "B",
    explanation: "The patient's presentation is highly suspicious for subarachnoid hemorrhage (SAH), most commonly caused by a ruptured cerebral aneurysm. A non-contrast CT scan of the brain is the first-line imaging study for suspected SAH, as it can detect acute blood in the subarachnoid space with high sensitivity in the first 24 hours. If the CT is negative but clinical suspicion remains high, a lumbar puncture should be performed. CT angiography or conventional angiography would be performed after confirming SAH to identify the source of bleeding.",
    category: "Neurology",
    difficulty: "expert"
  },
  {
    id: 13,
    text: "Which of the following best describes the mechanism of action of metformin in the treatment of type 2 diabetes mellitus?",
    options: [
      "Increases insulin secretion from pancreatic beta cells",
      "Decreases hepatic glucose production and increases peripheral glucose uptake",
      "Delays intestinal carbohydrate absorption",
      "Increases renal glucose excretion",
      "Activates insulin receptors"
    ],
    correctAnswer: "B",
    explanation: "Metformin, a biguanide, primarily works by decreasing hepatic glucose production (gluconeogenesis) and, to a lesser extent, increasing peripheral glucose uptake and utilization. It does not significantly affect insulin secretion (unlike sulfonylureas), carbohydrate absorption (unlike alpha-glucosidase inhibitors), renal glucose excretion (unlike SGLT2 inhibitors), or insulin receptor activation (unlike insulin).",
    category: "Endocrinology",
    difficulty: "medium"
  },
  {
    id: 14,
    text: "A 45-year-old female presents with recurrent episodes of flushing, diarrhea, and palpitations. Urinary 5-HIAA levels are elevated. Which of the following is the most likely diagnosis?",
    options: [
      "Pheochromocytoma",
      "Carcinoid syndrome",
      "Zollinger-Ellison syndrome",
      "Irritable bowel syndrome",
      "Systemic mastocytosis"
    ],
    correctAnswer: "B",
    explanation: "The combination of flushing, diarrhea, and palpitations, along with elevated urinary 5-hydroxyindoleacetic acid (5-HIAA, a metabolite of serotonin), is highly suggestive of carcinoid syndrome. This syndrome occurs when a carcinoid tumor (usually in the small intestine) metastasizes to the liver and releases vasoactive substances like serotonin into the systemic circulation. Pheochromocytoma typically presents with hypertension, headache, and sweating. Zollinger-Ellison syndrome presents with recurrent peptic ulcers and diarrhea due to gastrin-secreting tumors. Irritable bowel syndrome would not cause flushing or elevated 5-HIAA. Systemic mastocytosis can cause flushing and GI symptoms but would not elevate 5-HIAA.",
    category: "Oncology",
    difficulty: "expert"
  },
  {
    id: 15,
    text: "Which of the following is the most appropriate initial treatment for a patient with unstable angina?",
    options: [
      "Oral metoprolol",
      "Sublingual nitroglycerin",
      "Aspirin, heparin, and urgent cardiac catheterization",
      "Oral diltiazem",
      "Elective stress testing"
    ],
    correctAnswer: "C",
    explanation: "Unstable angina is part of the acute coronary syndrome spectrum and represents a medical emergency. The initial management includes aspirin (antiplatelet), heparin (anticoagulant), and consideration for urgent cardiac catheterization to define coronary anatomy and possibly perform revascularization. Sublingual nitroglycerin and beta-blockers like metoprolol are adjunctive therapies but not the most appropriate initial treatment alone. Diltiazem is not a first-line agent in unstable angina. Elective stress testing is inappropriate for unstable angina, which requires immediate evaluation and treatment.",
    category: "Cardiology",
    difficulty: "medium"
  }
];

// Interface for storage operations
export interface IStorage {
  // User methods (kept from original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Question methods
  getQuestions(): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsBySection(section: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  
  // Game methods
  saveGame(game: InsertGame): Promise<Game>;
  getTopScores(difficulty?: string, section?: string): Promise<Game[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private questionsList: Map<number, Question>;
  private gamesList: Map<number, Game>;
  userCurrentId: number;
  questionCurrentId: number;
  gameCurrentId: number;

  constructor() {
    this.users = new Map();
    this.questionsList = new Map();
    this.gamesList = new Map();
    this.userCurrentId = 1;
    this.questionCurrentId = 1;
    this.gameCurrentId = 1;
    
    // Initialize with sample questions
    sampleQuestions.forEach(question => {
      this.questionsList.set(question.id, question);
      this.questionCurrentId = Math.max(this.questionCurrentId, question.id + 1);
    });
  }

  // User methods (kept from original for compatibility)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Question methods
  async getQuestions(): Promise<Question[]> {
    return Array.from(this.questionsList.values());
  }
  
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questionsList.get(id);
  }

  async getQuestionsBySection(section: string): Promise<Question[]> {
    try {
      // Load questions from appropriate JSON file
      const fs = require('fs');
      const path = require('path');
      const jsonPath = path.resolve(`./data/${section.toLowerCase()}.json`);
      const rawData = fs.readFileSync(jsonPath, 'utf8');
      const data = JSON.parse(rawData);
      return data;
    } catch (error) {
      console.error(`Error loading questions for section ${section}:`, error);
      // If there's an error, return empty list
      return [];
    }
  }
  
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.questionCurrentId++;
    const question: Question = { ...insertQuestion, id };
    this.questionsList.set(id, question);
    return question;
  }
  
  // Game methods
  async saveGame(insertGame: InsertGame): Promise<Game> {
    const id = this.gameCurrentId++;
    const game: Game = { ...insertGame, id };
    this.gamesList.set(id, game);
    return game;
  }
  
  async getTopScores(difficulty?: string, section?: string): Promise<Game[]> {
    let games = Array.from(this.gamesList.values());
    
    if (difficulty) {
      games = games.filter(game => game.difficulty === difficulty);
    }
    
    if (section) {
      games = games.filter(game => game.section === section);
    }
    
    // Sort by finalScore (lower is better)
    return games.sort((a, b) => a.finalScore - b.finalScore).slice(0, 10);
  }
}

export const storage = new MemStorage();
