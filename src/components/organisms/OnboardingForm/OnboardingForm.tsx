import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { ChipGroup } from '@/components/molecules/ChipGroup'
import { FEEDING_OPTIONS } from '@/constants/feeding'
import { onboardingSchema } from '@/schemas/onboarding.schema'
import type { OnboardingValues } from '@/schemas/onboarding.schema'
import { toDateValue } from '@/utils/dates'
import type { ActionState } from '@/types'
import styles from './OnboardingForm.module.css'

const FEEDING_CHIPS = FEEDING_OPTIONS.map((o) => ({ value: o.code, label: o.label }))

type Props = {
  state: ActionState
  errorMessage?: string
  onSubmit: (values: OnboardingValues) => void
}

export function OnboardingForm({ state, errorMessage, onSubmit }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      childName: '',
      birthDate: '',
      feeding: '',
      reason: '',
      professional: '',
      startedAt: toDateValue(),
    },
  })

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <fieldset className={styles.group}>
        <legend className={styles.groupTitle}>A criança</legend>
        <Input
          label="Nome ou apelido"
          autoComplete="off"
          error={errors.childName?.message}
          {...register('childName')}
        />
        <Input
          label="Data de nascimento (opcional)"
          type="date"
          error={errors.birthDate?.message}
          {...register('birthDate')}
        />
        <Controller
          control={control}
          name="feeding"
          render={({ field }) => (
            <ChipGroup
              legend="Alimentação atual (opcional)"
              options={FEEDING_CHIPS}
              value={field.value ?? null}
              onChange={(value) => field.onChange(value ?? '')}
            />
          )}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.groupTitle}>O acompanhamento</legend>
        <Input
          label="Início do acompanhamento"
          type="date"
          error={errors.startedAt?.message}
          {...register('startedAt')}
        />
        <Textarea
          label="Motivo (opcional)"
          hint="O que levou a família a começar o acompanhamento."
          error={errors.reason?.message}
          {...register('reason')}
        />
        <Input
          label="Profissional de saúde (opcional)"
          autoComplete="off"
          error={errors.professional?.message}
          {...register('professional')}
        />
      </fieldset>

      <div aria-live="polite">
        {state === 'error' && errorMessage && <p className={styles.error}>{errorMessage}</p>}
      </div>

      <Button type="submit" busy={state === 'saving'} busyLabel="Criando...">
        Começar acompanhamento
      </Button>
    </form>
  )
}
