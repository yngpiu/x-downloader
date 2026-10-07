import { memo, useCallback } from "react"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DEFAULT_GEMINI_PROMPT,
  SUPPORTED_TARGET_LANGUAGES,
  type TranslationEngine,
  type TranslationSettings,
} from "@/utils/translation"
import { ExternalLink, Sparkles, Languages } from "lucide-react"

function GoogleTranslateIcon({
  className = "size-3.5",
}: {
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.11 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"
        fill="currentColor"
      />
    </svg>
  )
}

const translationFormSchema = z
  .object({
    engine: z.enum(["google", "gemini"]),
    targetLanguage: z.string(),
    geminiApiKey: z.string(),
    geminiPrompt: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.engine === "gemini") {
      if (!data.geminiApiKey.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["geminiApiKey"],
          message: "Please enter API Key to use Gemini",
        })
      }
      if (!data.geminiPrompt.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["geminiPrompt"],
          message: "Prompt cannot be empty",
        })
      }
    }
  })

export interface TranslationSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: TranslationSettings
  onSave: (settings: TranslationSettings) => void
}

interface FormInnerProps {
  settings: TranslationSettings
  onClose: () => void
  onSave: (settings: TranslationSettings) => void
}

const TranslationFormContent = memo(function TranslationFormContent({
  settings,
  onClose,
  onSave,
}: FormInnerProps) {
  const form = useForm({
    defaultValues: {
      engine: settings.engine,
      targetLanguage: settings.targetLanguage,
      geminiApiKey: settings.geminiApiKey,
      geminiPrompt: settings.geminiPrompt,
    },
    validators: {
      onSubmit: translationFormSchema,
    },
    onSubmit: ({ value }) => {
      onSave({
        engine: value.engine,
        targetLanguage: value.targetLanguage,
        geminiApiKey: value.geminiApiKey.trim(),
        geminiPrompt: value.geminiPrompt.trim() || DEFAULT_GEMINI_PROMPT,
      })
      onClose()
    },
  })

  const handleResetPrompt = useCallback(() => {
    form.setFieldValue("geminiPrompt", DEFAULT_GEMINI_PROMPT)
  }, [form])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex flex-col gap-4"
    >
      <FieldGroup className="gap-4">
        {/* Engine selector */}
        <form.Field name="engine">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Translation Engine</FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value}
                  onValueChange={(val) => {
                    if (val === "google" || val === "gemini") {
                      field.handleChange(val as TranslationEngine)
                    }
                  }}
                >
                  <SelectTrigger
                    id={field.name}
                    aria-invalid={isInvalid}
                    className="w-full"
                  >
                    <SelectValue placeholder="Select translation engine">
                      {field.state.value === "google" ? (
                        <div className="flex items-center gap-2">
                          <GoogleTranslateIcon className="size-3.5 shrink-0 text-blue-500" />
                          <span className="font-medium">Google Translate</span>
                          <span className="text-xs text-muted-foreground">
                            (Fast, less accurate)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-3.5 shrink-0 text-primary" />
                          <span className="font-medium">Gemini AI</span>
                          <span className="text-xs text-muted-foreground">
                            (Slower, more accurate)
                          </span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">
                      <div className="flex items-center gap-2">
                        <GoogleTranslateIcon className="size-3.5 shrink-0 text-blue-500" />
                        <span className="font-medium">Google Translate</span>
                        <span className="text-xs text-muted-foreground">
                          (Fast, less accurate)
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gemini">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-3.5 shrink-0 text-primary" />
                        <span className="font-medium">Gemini AI</span>
                        <span className="text-xs text-muted-foreground">
                          (Slower, more accurate)
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Select translation processing system.
                </FieldDescription>
                {isInvalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </Field>
            )
          }}
        </form.Field>

        {/* Target Language Selector */}
        <form.Field name="targetLanguage">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Target Language</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(val) => field.handleChange(val || "")}
                >
                  <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                    <SelectValue>
                      {SUPPORTED_TARGET_LANGUAGES.find((l) => l.code === field.state.value)?.name || field.state.value}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_TARGET_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  The language you want to translate into.
                </FieldDescription>
                {isInvalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </Field>
            )
          }}
        </form.Field>

        {/* Gemini API Key & Prompt directly outside (not inside a card/border box) */}
        <form.Subscribe selector={(state) => state.values.engine}>
          {(currentEngine) => {
            if (currentEngine !== "gemini") return null

            return (
              <>
                <form.Field name="geminiApiKey">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <div className="flex items-center justify-between">
                          <FieldLabel htmlFor={field.name}>
                            Gemini API Key
                          </FieldLabel>
                          <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-normal text-primary hover:underline"
                          >
                            Get Gemini API Key
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          placeholder="AIzaSy..."
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          className="font-mono text-xs"
                          autoComplete="off"
                        />
                        <FieldDescription>
                          Stored safely on device, not sent to server.
                        </FieldDescription>
                        {isInvalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null}
                      </Field>
                    )
                  }}
                </form.Field>

                <form.Field name="geminiPrompt">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <div className="flex items-center justify-between">
                          <FieldLabel htmlFor={field.name}>
                            Translation prompt
                          </FieldLabel>
                          <button
                            type="button"
                            onClick={handleResetPrompt}
                            className="cursor-pointer text-[11px] text-muted-foreground underline hover:text-foreground"
                          >
                            Restore default
                          </button>
                        </div>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          rows={3}
                          placeholder="Enter translation prompt..."
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          className="resize-none text-xs"
                        />
                        <FieldDescription>
                          Set translation tone and context.
                        </FieldDescription>
                        {isInvalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : null}
                      </Field>
                    )
                  }}
                </form.Field>
              </>
            )
          }}
        </form.Subscribe>
      </FieldGroup>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save settings</Button>
      </DialogFooter>
    </form>
  )
})

export const TranslationSettingsDialog = memo(
  function TranslationSettingsDialog({
    open,
    onOpenChange,
    settings,
    onSave,
  }: TranslationSettingsDialogProps) {
    const handleClose = useCallback(() => {
      onOpenChange(false)
    }, [onOpenChange])

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Languages className="size-5 shrink-0 text-primary" />
              Translation Settings
            </DialogTitle>
            <DialogDescription>
              Customize automatic translation using Google Translate
              or Gemini AI model.
            </DialogDescription>
          </DialogHeader>

          {open ? (
            <TranslationFormContent
              key={open ? "open" : "closed"}
              settings={settings}
              onClose={handleClose}
              onSave={onSave}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    )
  }
)
