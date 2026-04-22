import { useMemo, useRef, useState } from "react";
import {
  Bot,
  ChefHat,
  Heart,
  History,
  Plus,
  ScanLine,
  Send,
  Sparkles,
  Upload,
} from "lucide-react";
import recipeAPI from "../services/recipeService";
import api from "../services/api";
import { Button, Card, FadeIn, MetricBox, cn } from "../components/ui";

function normalizeRecipe(recipe) {
  if (!recipe) return null;

  const rawText = [recipe.description, recipe.response, recipe.reply]
    .filter(Boolean)
    .join("\n")
    .trim();

  const fallbackName = recipe.recipeName || recipe.title || "Recipe Output";
  const normalized = {
    name: fallbackName,
    summary: "",
    time: "",
    ingredients: Array.isArray(recipe.subsections?.find((section) => /ingredient/i.test(section.heading))?.items)
      ? recipe.subsections.find((section) => /ingredient/i.test(section.heading)).items
      : [],
    steps: Array.isArray(recipe.subsections?.find((section) => /instruction|step/i.test(section.heading))?.steps)
      ? recipe.subsections.find((section) => /instruction|step/i.test(section.heading)).steps
      : [],
  };

  if (!rawText) {
    return normalized;
  }

  const cleaned = rawText
    .replace(/\*\*/g, "")
    .replace(/\r/g, "")
    .trim();

  const recipeNameMatch =
    cleaned.match(/recipe\s*name\s*:?\s*(.+)/i) ||
    cleaned.match(/^([^\n:]{4,80})$/m);
  if (recipeNameMatch?.[1]) {
    normalized.name = recipeNameMatch[1].trim();
  }

  const timeMatch =
    cleaned.match(/(?:cooking|prep(?:aration)?)\s*time(?:\s*estimate)?\s*:?\s*(.+)/i) ||
    cleaned.match(/(\d+\s*(?:-|to)?\s*\d*\s*(?:minutes|minute|mins|min|hours|hour))/i);
  if (timeMatch?.[1]) {
    normalized.time = timeMatch[1].trim().replace(/\.$/, "");
  }

  const ingredientsMatch = cleaned.match(
    /key\s*ingredients?\s*:?\s*(.+?)(?=(?:simple\s*steps?|steps?|cooking\s*time|prep(?:aration)?\s*time|$))/is
  );
  if (ingredientsMatch?.[1] && normalized.ingredients.length === 0) {
    normalized.ingredients = ingredientsMatch[1]
      .split(/,|\n| - /)
      .map((item) => item.replace(/^[\s•\-0-9.]+/, "").trim())
      .filter(Boolean);
  }

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (normalized.steps.length === 0) {
    const numberedSteps = lines
      .filter((line) => /^\d+[\).\s-]/.test(line))
      .map((line) => line.replace(/^\d+[\).\s-]*/, "").trim())
      .filter(Boolean);

    if (numberedSteps.length > 0) {
      normalized.steps = numberedSteps;
    } else {
      const stepsBlock = cleaned.match(
        /(?:simple\s*steps?|steps?)\s*:?\s*(.+?)(?=(?:cooking\s*time|prep(?:aration)?\s*time|$))/is
      );
      if (stepsBlock?.[1]) {
        normalized.steps = stepsBlock[1]
          .split(/\.\s+(?=[A-Z0-9])|\n|(?<=\.)\s+(?=\d)/)
          .map((step) => step.replace(/^[\s•\-0-9.]+/, "").trim())
          .filter(Boolean);
      }
    }
  }

  const summarySource = cleaned
    .replace(/recipe\s*name\s*:?\s*.+/i, "")
    .replace(/key\s*ingredients?\s*:?\s*.+/i, "")
    .replace(/(?:simple\s*steps?|steps?)\s*:?\s*.+/i, "")
    .replace(/(?:cooking|prep(?:aration)?)\s*time(?:\s*estimate)?\s*:?\s*.+/i, "")
    .trim();

  if (summarySource && summarySource.length < 220) {
    normalized.summary = summarySource;
  }

  if (normalized.ingredients.length === 0 && recipe.ingredients) {
    normalized.ingredients = String(recipe.ingredients)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (normalized.steps.length === 0 && cleaned) {
    normalized.steps = cleaned
      .split(/\.\s+/)
      .map((step) => step.replace(/^[\s•\-0-9.]+/, "").trim())
      .filter((step) => step.length > 0)
      .slice(0, 6);
  }

  return normalized;
}

export default function Recipe() {
  const [image, setImage] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [recipe, setRecipe] = useState(null);
  const [chatReply, setChatReply] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const canGenerate = useMemo(
    () => ingredients.some((ingredient) => ingredient.trim()),
    [ingredients]
  );
  const formattedRecipe = useMemo(() => normalizeRecipe(recipe), [recipe]);

  const handleImage = async (file) => {
    if (!file) return;
    setImage(URL.createObjectURL(file));
    setLoadingRecipe(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await recipeAPI.post("/upload", formData);
      const detected = response.data.ingredients || [];
      setIngredients((current) => [...new Set([...current, ...detected])]);
    } catch (error) {
      console.error("Ingredient detection failed", error);
    } finally {
      setLoadingRecipe(false);
    }
  };

  const generateRecipe = async () => {
    if (!canGenerate) return;
    setLoadingRecipe(true);

    try {
      const response = await recipeAPI.post("/recipe", {
        ingredients: ingredients.filter((item) => item.trim()),
      });
      setRecipe(response.data);
    } catch (error) {
      console.error("Recipe generation failed", error);
    } finally {
      setLoadingRecipe(false);
    }
  };

  const sendChat = async () => {
    if (!chatMessage.trim()) return;
    setLoadingChat(true);

    try {
      const response = await api.post("/chat", {
        message: chatMessage,
      });
      setChatReply(response.data.reply || "");
    } catch (error) {
      console.error("Chat request failed", error);
      setChatReply("AI chat placeholder connected. Replace with your backend response.");
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div
      className="space-y-8"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleImage(event.dataTransfer.files?.[0]);
      }}
    >
      <FadeIn>
        <Card glow="emerald">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.95fr]">
            <div>
              <p className="section-label">AI Kitchen</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                AI Kitchen Assistant
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Generate recipes from your pantry, scan ingredients with vision,
                and send prompts to your culinary AI assistant.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ActionButton
                icon={ChefHat}
                label="Generate Recipe"
                sublabel="POST /api/recipe"
                onClick={generateRecipe}
              />
              <ActionButton
                icon={ScanLine}
                label="Scan Ingredients"
                sublabel="Image detection"
                onClick={() => fileInputRef.current?.click()}
              />
              <ActionButton
                icon={History}
                label="View History"
                sublabel="Recent meals"
              />
              <ActionButton icon={Heart} label="Favorites" sublabel="Saved ideas" />
            </div>
          </div>
        </Card>
      </FadeIn>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <FadeIn delay={0.08}>
            <Card glow="emerald">
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-label">Vision Input</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Analyze Ingredients
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border border-white/10 bg-white/6 p-3 text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <Upload size={18} />
                </button>
              </div>

              <div
                className={cn(
                  "mt-8 flex min-h-[280px] items-center justify-center rounded-[28px] border border-dashed transition",
                  dragging
                    ? "border-primary-300 bg-primary-400/10"
                    : "border-white/12 bg-white/4 hover:bg-white/8"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {image ? (
                  <div className="relative h-full w-full overflow-hidden rounded-[28px]">
                    <img
                      src={image}
                      alt="Ingredient preview"
                      className="h-[280px] w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 to-transparent p-5">
                      <p className="text-sm font-semibold text-white">
                        {loadingRecipe
                          ? "Scanning ingredients..."
                          : "Ingredient frame captured"}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                        Vision scan ready
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/8 text-primary-200">
                      <Upload size={26} />
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold text-white">
                      Analyze Ingredients
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Drag and drop a food photo or upload a pantry image.
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={(event) => handleImage(event.target.files?.[0])}
              />
            </Card>
          </FadeIn>

          <FadeIn delay={0.14}>
            <Card glow="indigo">
              <div className="flex items-center gap-3">
                <Bot size={20} className="text-primary-200" />
                <h2 className="text-2xl font-semibold text-white">AI Chat</h2>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Placeholder wired to <code>POST /api/chat</code>.
              </p>

              <div className="mt-6 flex gap-3">
                <input
                  value={chatMessage}
                  onChange={(event) => setChatMessage(event.target.value)}
                  placeholder="Ask for meal prep ideas, substitutions, or macros..."
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400"
                />
                <Button onClick={sendChat} disabled={loadingChat}>
                  <Send size={16} />
                  Send
                </Button>
              </div>

              <div className="mt-5 rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Assistant Reply
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  {loadingChat
                    ? "Thinking..."
                    : chatReply ||
                      "Your AI kitchen assistant will surface recipe ideas, substitutions, and flavor pairings here."}
                </p>
              </div>
            </Card>
          </FadeIn>

          {recipe ? (
            <FadeIn delay={0.2}>
              <Card glow="amber">
                <p className="section-label">Generated Recipe</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  {formattedRecipe?.name || "Recipe Output"}
                </h2>
                {formattedRecipe?.summary ? (
                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    {formattedRecipe.summary}
                  </p>
                ) : null}

                {formattedRecipe?.time ? (
                  <div className="mt-5 inline-flex rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200">
                    Cooking time: {formattedRecipe.time}
                  </div>
                ) : null}

                {formattedRecipe?.ingredients?.length ? (
                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      Ingredients
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formattedRecipe.ingredients.map((item) => (
                        <span
                          key={item}
                          className="rounded-2xl border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-slate-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {formattedRecipe?.steps?.length ? (
                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      Steps
                    </p>
                    <ol className="mt-3 space-y-3">
                      {formattedRecipe.steps.map((step, index) => (
                        <li
                          key={`${index + 1}-${step}`}
                          className="flex gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-400/20 text-sm font-semibold text-primary-100">
                            {index + 1}
                          </span>
                          <span className="pt-0.5 text-sm leading-6 text-slate-200">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </Card>
            </FadeIn>
          ) : null}
        </div>

        <div className="space-y-6">
          <FadeIn delay={0.12}>
            <Card glow="emerald">
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-label">Pantry</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Pantry Panel</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIngredients((current) => [...current, ""])}
                  className="rounded-2xl border border-white/10 bg-white/6 p-3 text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {ingredients.length ? (
                  ingredients.map((ingredient, index) => (
                    <input
                      key={`${ingredient}-${index}`}
                      value={ingredient}
                      onChange={(event) => {
                        const next = [...ingredients];
                        next[index] = event.target.value;
                        setIngredients(next);
                      }}
                      placeholder="Add ingredient"
                      className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400"
                    />
                  ))
                ) : (
                  <div className="rounded-[28px] border border-dashed border-white/10 bg-white/4 px-6 py-10 text-center">
                    <p className="text-lg font-semibold text-white">Pantry is empty</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Scan ingredients or add items manually to get started.
                    </p>
                  </div>
                )}
              </div>

              <Button
                className="mt-6 w-full"
                onClick={generateRecipe}
                disabled={!canGenerate || loadingRecipe}
              >
                <Sparkles size={16} />
                Generate Recipe
              </Button>
            </Card>
          </FadeIn>

          <FadeIn delay={0.18}>
            <Card glow="amber">
              <MetricBox
                label="API Placeholders"
                value="Recipe + Chat Ready"
                delta="POST /api/recipe and POST /api/chat are connected in the UI layer."
                icon={Bot}
                tone="amber"
                className="min-h-0"
              />
            </Card>
          </FadeIn>

        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, sublabel, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-3xl border border-white/10 bg-white/6 p-5 text-left transition duration-300 hover:-translate-y-1 hover:bg-white/9"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-primary-200">
        <Icon size={18} />
      </div>
      <p className="mt-4 text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
        {sublabel}
      </p>
    </button>
  );
}
