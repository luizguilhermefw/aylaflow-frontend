<template>
  <div class="image-upload">
    <input
      id="campaign-image"
      ref="fileInput"
      class="file-input"
      type="file"
      accept="image/jpeg,image/png"
      :disabled="disabled"
      @change="handleFileChange"
    />

    <div v-if="modelValue && previewUrl" class="selected-image">
      <img :src="previewUrl" :alt="`Prévia da imagem ${modelValue.name}`" />
      <div class="file-details">
        <strong>{{ modelValue.name }}</strong>
        <span>{{ formatFileSize(modelValue.size) }}</span>
        <div class="file-actions">
          <label
            for="campaign-image"
            class="file-action"
            :class="{ disabled }"
            :aria-disabled="disabled"
            @click="disabled && $event.preventDefault()"
          >
            Trocar imagem
          </label>
          <button type="button" class="file-action remove-action" :disabled="disabled" @click="removeFile">
            Remover
          </button>
        </div>
      </div>
    </div>

    <label
      v-else
      for="campaign-image"
      class="upload-trigger"
      :class="{ disabled }"
      :aria-disabled="disabled"
      @click="disabled && $event.preventDefault()"
    >
      <span class="upload-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
      </span>
      <strong>Selecionar imagem</strong>
      <span>JPG ou PNG, até 5 MB</span>
    </label>

    <p v-if="error" class="upload-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png']

const props = defineProps<{
  modelValue: File | null
  disabled: boolean
  error: string
}>()

const emit = defineEmits<{
  'update:modelValue': [file: File | null]
  'validation-error': [message: string]
  'preview-url': [url: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref('')

function revokePreviewUrl() {
  if (!previewUrl.value) return

  URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  emit('preview-url', '')
}

function validateFile(file: File) {
  if (file.size === 0) {
    return 'A imagem selecionada está vazia.'
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Selecione uma imagem JPG ou PNG.'
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return 'A imagem deve ter no máximo 5 MB.'
  }

  return ''
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) return

  const validationError = validateFile(file)
  if (validationError) {
    emit('update:modelValue', null)
    emit('validation-error', validationError)
    return
  }

  emit('validation-error', '')
  emit('update:modelValue', file)
}

function removeFile() {
  if (props.disabled) return

  emit('validation-error', '')
  emit('update:modelValue', null)
  if (fileInput.value) fileInput.value.value = ''
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

watch(
  () => props.modelValue,
  (file) => {
    revokePreviewUrl()
    if (file) {
      previewUrl.value = URL.createObjectURL(file)
      emit('preview-url', previewUrl.value)
    }
  },
  { immediate: true },
)

onBeforeUnmount(revokePreviewUrl)
</script>

<style scoped>
.image-upload {
  width: 100%;
}

.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.upload-trigger {
  min-height: 180px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  color: var(--text-muted);
  background: var(--input-bg);
  border: 1.5px dashed var(--input-border);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.upload-trigger:hover:not(.disabled) {
  background: var(--nav-hover);
  border-color: var(--brand);
}

.file-input:focus-visible + .selected-image,
.file-input:focus-visible + .upload-trigger {
  outline: 2px solid var(--brand-light);
  outline-offset: 2px;
}

.upload-trigger.disabled,
.file-action.disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.upload-trigger strong {
  color: var(--text-primary);
  font-size: 0.9rem;
}

.upload-trigger > span:last-child {
  font-size: 0.78rem;
}

.upload-icon {
  width: 52px;
  height: 52px;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-light);
  background: var(--brand-subtle);
  border-radius: 14px;
}

.selected-image {
  min-height: 210px;
  display: grid;
  grid-template-columns: minmax(180px, 280px) 1fr;
  overflow: hidden;
  background: var(--input-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
}

.selected-image img {
  width: 100%;
  height: 210px;
  display: block;
  object-fit: cover;
  background: var(--bg-primary);
}

.file-details {
  min-width: 0;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.file-details strong {
  max-width: 100%;
  color: var(--text-primary);
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}

.file-details > span {
  margin-top: 0.25rem;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.file-actions {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.file-action {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--card-border);
  border-radius: 8px;
  color: var(--text-secondary);
  background: var(--nav-hover);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.file-action:hover:not(:disabled):not(.disabled) {
  color: var(--text-primary);
  background: var(--brand-subtle);
}

.remove-action {
  color: var(--error);
}

.file-action:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.upload-error {
  margin-top: 0.5rem;
  color: var(--error);
  font-size: 0.78rem;
}

@media (max-width: 640px) {
  .selected-image {
    grid-template-columns: 1fr;
  }

  .selected-image img {
    height: 190px;
  }
}
</style>
