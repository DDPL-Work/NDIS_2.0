import { useMemo, useState, useEffect } from "react";
import { CheckCircle2, MessageSquare, Star, Loader2 } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { backendFeedbackApi, extractQuestions } from "../../api/feedbackApi";
import { FEEDBACK_RESPONSE_TYPES } from "../feedback/feedbackConstants";

// ---------------------------------------------------------------------------
// QuestionRenderer — renders a single feedback question based on its
// normalized responseType.  Supports all backend types:
//   RATING_5 / RATING, YES_NO, SINGLE_CHOICE, MULTIPLE_CHOICE,
//   TEXT, TEXTAREA, NUMBER
// Falls back to a text input for unknown types.
// ---------------------------------------------------------------------------
function QuestionRenderer({ question, value, onChange, invalid, disabled }) {
  const id = `feedback-${question.id}`;
  const rt = question.responseType;

  // Yes/No is a special case of single_choice with fixed options
  const isYesNo = rt === FEEDBACK_RESPONSE_TYPES.YES_NO;
  const isSingleChoice =
    rt === FEEDBACK_RESPONSE_TYPES.SINGLE_CHOICE || isYesNo;
  const isMultipleChoice = rt === FEEDBACK_RESPONSE_TYPES.MULTIPLE_CHOICE;
  const isRating =
    rt === FEEDBACK_RESPONSE_TYPES.RATING ||
    rt === FEEDBACK_RESPONSE_TYPES.RATING_5;
  const isText = rt === FEEDBACK_RESPONSE_TYPES.TEXT;
  const isTextarea = rt === FEEDBACK_RESPONSE_TYPES.TEXTAREA;
  const isNumber = rt === FEEDBACK_RESPONSE_TYPES.NUMBER;

  const options = isYesNo
    ? [
        { value: "YES", label: "Yes" },
        { value: "NO", label: "No" },
      ]
    : question.options || [];

  return (
    <fieldset
      id={id}
      aria-invalid={invalid}
      className={`rounded-xl border p-4 ${
        invalid ? "border-alert-300 bg-alert-50/30" : "border-ink-100 bg-white"
      }`}
    >
      <legend className="px-1 text-[13px] font-semibold text-ink-900">
        {question.text}
        {question.required && (
          <span className="ml-1 text-alert-600">*</span>
        )}
      </legend>

      {/* Single choice / Yes-No — radio buttons */}
      {isSingleChoice && (
        <div
          className="mt-3 grid gap-2 sm:grid-cols-2"
          role="radiogroup"
          aria-label={question.text}
        >
          {options.map((option) => (
            <label
              key={option.value}
              className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px] transition ${
                value === option.value
                  ? "border-sky-600 bg-sky-50 text-sky-900"
                  : "border-ink-200 hover:border-ink-300"
              }`}
            >
              <input
                type="radio"
                name={id}
                value={option.value}
                checked={value === option.value}
                disabled={disabled}
                onChange={() => onChange(question.id, option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      )}

      {/* Multiple choice — checkboxes */}
      {isMultipleChoice && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2" role="group" aria-label={question.text}>
          {options.map((option) => {
            const checked = Array.isArray(value) && value.includes(option.value);
            return (
              <label
                key={option.value}
                className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px] transition ${
                  checked
                    ? "border-sky-600 bg-sky-50 text-sky-900"
                    : "border-ink-200 hover:border-ink-300"
                }`}
              >
                <input
                  type="checkbox"
                  value={option.value}
                  checked={checked}
                  disabled={disabled}
                  onChange={(e) => {
                    const current = Array.isArray(value) ? [...value] : [];
                    if (e.target.checked) {
                      onChange(question.id, [...current, option.value]);
                    } else {
                      onChange(
                        question.id,
                        current.filter((v) => v !== option.value)
                      );
                    }
                  }}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      )}

      {/* Rating — star buttons (1-5) */}
      {isRating && (
        <div
          className="mt-3 flex items-center gap-1"
          role="radiogroup"
          aria-label={question.text}
        >
          {Array.from({ length: 5 }, (_, i) => i + 1).map((rating) => (
            <button
              key={rating}
              type="button"
              disabled={disabled}
              onClick={() => onChange(question.id, rating)}
              aria-label={`${rating} out of 5`}
              aria-pressed={Number(value) === rating}
              className={`grid h-11 w-11 place-items-center rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500 ${
                rating <= Number(value || 0)
                  ? "bg-saffron-50 text-saffron-500"
                  : "text-ink-300 hover:bg-ink-50"
              }`}
            >
              <Star
                size={24}
                fill={rating <= Number(value || 0) ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      )}

      {/* Text — single-line input */}
      {isText && (
        <div className="mt-3">
          <input
            type="text"
            value={value || ""}
            disabled={disabled}
            onChange={(e) => onChange(question.id, e.target.value)}
            className="input-field w-full"
            placeholder="Type your response…"
          />
        </div>
      )}

      {/* Textarea — multi-line input */}
      {isTextarea && (
        <div className="mt-3">
          <textarea
            value={value || ""}
            disabled={disabled}
            maxLength={300}
            onChange={(e) => onChange(question.id, e.target.value)}
            rows={3}
            className="input-field resize-none"
            placeholder="Share your experience…"
          />
          <p className="mt-1 text-right text-[11px] text-ink-400">
            {String(value || "").length}/300
          </p>
        </div>
      )}

      {/* Number — numeric input */}
      {isNumber && (
        <div className="mt-3">
          <input
            type="number"
            value={value ?? ""}
            disabled={disabled}
            onChange={(e) => onChange(question.id, e.target.value)}
            className="input-field w-full"
            placeholder="Enter a number"
          />
        </div>
      )}

      {/* Fallback for unknown response types */}
      {!isSingleChoice &&
        !isMultipleChoice &&
        !isRating &&
        !isText &&
        !isTextarea &&
        !isNumber && (
          <div className="mt-3">
            {options.length > 0 ? (
              <select
                value={value || ""}
                disabled={disabled}
                onChange={(e) => onChange(question.id, e.target.value)}
                className="input-field w-full"
              >
                <option value="">Select…</option>
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={value || ""}
                disabled={disabled}
                onChange={(e) => onChange(question.id, e.target.value)}
                className="input-field w-full"
                placeholder="Type your response…"
              />
            )}
          </div>
        )}

      {invalid && (
        <p className="mt-2 text-[12px] text-alert-700">
          Please answer this required question.
        </p>
      )}
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// CitizenFeedbackModal
// ---------------------------------------------------------------------------
export default function CitizenFeedbackModal({ facility, open, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState("");
  const [answers, setAnswers] = useState({});
  const [invalid, setInvalid] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setQuestionsLoading(true);
    setQuestionsError("");
    setAnswers({});
    setInvalid([]);
    setResult(null);
    setSubmitError("");

    backendFeedbackApi
      .listQuestionSets({
        department: facility?.departmentId,
        service_type: facility?.categoryId,
        location_type: "facility",
      })
      .then((raw) => {
        if (cancelled) return;
        // Normalize: extract questions from nested results[].questions[]
        const normalized = extractQuestions(raw);
        setQuestions(normalized);
      })
      .catch(() => {
        if (!cancelled)
          setQuestionsError("Unable to load feedback questions. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setQuestionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, facility?.departmentId, facility?.categoryId]);

  const change = (id, value) => {
    setAnswers((current) => ({ ...current, [id]: value }));
    setInvalid((current) => current.filter((key) => key !== id));
    setSubmitError("");
  };

  const close = () => {
    setAnswers({});
    setInvalid([]);
    setResult(null);
    setSubmitError("");
    onClose();
  };

  const submit = async () => {
    const missing = questions
      .filter(
        (q) =>
          q.required && (answers[q.id] === undefined || answers[q.id] === "")
      )
      .map((q) => q.id);
    if (missing.length) {
      setInvalid(missing);
      requestAnimationFrame(() => {
        const field = document.getElementById(`feedback-${missing[0]}`);
        field?.scrollIntoView({ behavior: "smooth", block: "center" });
        field?.querySelector("input, button, textarea, select")?.focus();
      });
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        facility: facility?.id,
        department: facility?.departmentId,
        district: facility?.districtId,
        responses: questions.map((q) => ({
          question: q.id,
          answer: answers[q.id],
        })),
      };
      const submission = await backendFeedbackApi.createSubmission(payload);
      setResult(submission);
    } catch {
      setSubmitError("We could not submit your feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const footer = result ? (
    <Button onClick={close}>Done</Button>
  ) : (
    <>
      <Button variant="outline" onClick={close} disabled={submitting}>
        Cancel
      </Button>
      <Button onClick={submit} loading={submitting} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit feedback"}
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={close}
      title="Give Feedback"
      width="max-w-2xl"
      footer={footer}
    >
      {result ? (
        <div className="py-6 text-center">
          <CheckCircle2 size={52} className="mx-auto text-leaf-600" />
          <h4 className="mt-3 text-lg font-semibold text-ink-950">
            Feedback submitted
          </h4>
          <p className="mt-1 text-[13px] text-ink-600">
            Thank you for helping improve services in your area.
          </p>
          <div className="mx-auto mt-5 max-w-md rounded-xl bg-ink-50 p-4 text-left text-[13px]">
            <p>
              <span className="text-ink-500">Facility:</span>{" "}
              <strong>{facility?.name}</strong>
            </p>
            <p className="mt-1">
              <span className="text-ink-500">Feedback reference:</span>{" "}
              <span className="kbd-mono">{result.id}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
            <div className="flex gap-3">
              <MessageSquare className="mt-0.5 text-sky-700" size={20} />
              <div>
                <p className="font-semibold text-ink-950">
                  Help us understand how this facility or service is performing.
                </p>
                <dl className="mt-2 grid gap-1 text-[12px] text-ink-600">
                  <div>
                    <dt className="inline text-ink-500">Facility: </dt>
                    <dd className="inline font-medium">{facility?.name}</dd>
                  </div>
                  <div>
                    <dt className="inline text-ink-500">Department: </dt>
                    <dd className="inline">
                      {facility?.departmentName || "Department"}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline text-ink-500">Location: </dt>
                    <dd className="inline">
                      {facility?.village ||
                        facility?.districtName ||
                        "Location unavailable"}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-[11px] text-ink-500">
                  Development feedback questions — not a complaint report.
                </p>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {questionsLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-500">
              <Loader2 size={16} className="animate-spin" /> Loading feedback
              questions…
            </div>
          )}

          {/* Error state */}
          {questionsError && (
            <p
              className="rounded-lg border border-alert-200 bg-alert-50 p-3 text-[12px] text-alert-700"
              role="alert"
            >
              {questionsError}
            </p>
          )}

          {/* Empty state — only shown when NOT loading, no error, and truly empty */}
          {!questionsLoading && !questionsError && questions.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-500">
              No feedback questions are configured for this facility.
            </p>
          )}

          {/* Questions */}
          {questions.map((question) => (
            <QuestionRenderer
              key={question.id}
              question={question}
              value={answers[question.id]}
              onChange={change}
              invalid={invalid.includes(question.id)}
              disabled={submitting}
            />
          ))}

          {/* Submit error */}
          {submitError && (
            <p
              className="rounded-lg border border-alert-200 bg-alert-50 p-3 text-[12px] text-alert-700"
              role="alert"
            >
              {submitError}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
