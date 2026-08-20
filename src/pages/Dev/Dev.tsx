import { useState } from 'react'
import { Milk } from 'lucide-react'
import { AnimatedContent } from '@/components/animations/AnimatedContent'
import { ClickSpark } from '@/components/animations/ClickSpark'
import { CountUp } from '@/components/animations/CountUp'
import { FadeContent } from '@/components/animations/FadeContent'
import { SpotlightCard } from '@/components/animations/SpotlightCard'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Chip } from '@/components/atoms/Chip'
import { Input } from '@/components/atoms/Input'
import { Loading } from '@/components/atoms/Loading'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { ActionTile } from '@/components/molecules/ActionTile'
import { Alert } from '@/components/molecules/Alert'
import { Card } from '@/components/molecules/Card'
import { SeveritySelector } from '@/components/molecules/SeveritySelector'
import { SymptomRow } from '@/components/molecules/SymptomRow'
import { Toast } from '@/components/molecules/Toast'
import { Modal } from '@/components/organisms/Modal'
import { SYMPTOMS } from '@/constants/symptoms'
import type { Intensity } from '@/constants/symptoms'
import styles from './Dev.module.css'

type ToastVariant = 'success' | 'error' | 'info'

const COLOR_TOKENS = [
  'primary',
  'primary-hover',
  'primary-soft',
  'background',
  'surface',
  'text',
  'muted',
  'border',
  'danger',
  'danger-soft',
  'success',
  'success-soft',
]

const byCode = (code: string) => SYMPTOMS.find((symptom) => symptom.code === code)

function Section({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{title}</h2>
      {note && <p className={styles.note}>{note}</p>}
      <div className={styles.demo}>{children}</div>
    </section>
  )
}

/**
 * Catálogo vivo do Design System (M11). Só monta em desenvolvimento — a
 * família não carrega bytes de ferramenta interna.
 *
 * Aqui não existe regra de negócio: nenhum componente desta página fala com
 * `services/` ou com o Supabase.
 */
export default function Dev() {
  const [chip, setChip] = useState<string | null>('habitual')
  const [intensity, setIntensity] = useState<Intensity | null>(null)
  const [rowIntensity, setRowIntensity] = useState<Intensity | null>(2)
  const [alarmIntensity, setAlarmIntensity] = useState<Intensity | null>(3)
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState<ToastVariant | null>(null)

  const mucus = byCode('mucus_stool')
  const vomit = byCode('vomit')
  const alarmSymptom = byCode('blood_stool')

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Design System</h1>
        <p className={styles.subtitle}>
          Os 14 componentes do inventário, em todos os estados. Todo valor visual vem de
          <code> tokens.css</code>.
        </p>
      </header>

      <Section title="Tokens de cor" note="Nenhuma cor crua existe fora deste arquivo.">
        <ul className={styles.swatches}>
          {COLOR_TOKENS.map((token) => (
            <li key={token} className={styles.swatch}>
              <span
                className={styles.swatchColor}
                style={{ background: `var(--color-${token})` }}
                aria-hidden="true"
              />
              <code className={styles.swatchName}>--color-{token}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Button"
        note="primary · secondary · ghost, cada um em normal, saving e desabilitado."
      >
        <div className={styles.row}>
          <Button>Salvar registro</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="ghost">Sair</Button>
        </div>
        <div className={styles.row}>
          <Button busy>Salvar registro</Button>
          <Button variant="secondary" busy busyLabel="Entrando...">
            Entrar
          </Button>
          <Button disabled>Indisponível</Button>
        </div>
      </Section>

      <Section title="Input">
        <Input label="Nome ou apelido" placeholder="Como a família chama" />
        <Input label="Data e hora" type="datetime-local" defaultValue="2026-08-20T14:32" />
        <Input label="Alimento" defaultValue="" error="Informe o que foi consumido." />
      </Section>

      <Section
        title="Select"
        note="Existe para listas longas demais para virarem chips. Nenhuma tela de registro usa uma — a escolha é sempre por toque."
      >
        <Select
          label="Etapa"
          placeholder="Selecione"
          options={[
            { value: '1', label: '1 — Preparação assada' },
            { value: '2', label: '2 — Derivado aquecido' },
          ]}
        />
        <Select
          label="Etapa"
          options={[{ value: '1', label: '1 — Preparação assada' }]}
          error="Opção inválida."
        />
      </Section>

      <Section title="Textarea">
        <Textarea label="Observação (opcional)" hint="Só o que você observou." />
        <Textarea label="Observação" error="Use no máximo 2000 caracteres." />
      </Section>

      <Section title="Chip" note="soft para catálogo, strong para a intensidade do sintoma.">
        <div className={styles.row}>
          {[
            { value: 'pequena', label: 'Pequena' },
            { value: 'habitual', label: 'Habitual' },
            { value: 'maior', label: 'Maior que o habitual' },
          ].map((option) => (
            <Chip
              key={option.value}
              selected={chip === option.value}
              onClick={() => setChip(chip === option.value ? null : option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
        <div className={styles.row}>
          <Chip tone="strong" selected>
            Selecionado (strong)
          </Chip>
          <Chip tone="strong">Não selecionado</Chip>
        </div>
      </Section>

      <Section title="Badge">
        <div className={styles.row}>
          <Badge>Etapa 1</Badge>
          <Badge tone="primary">Avançou</Badge>
          <Badge tone="success">Sem sintomas</Badge>
          <Badge tone="danger">Sinal de alarme</Badge>
        </div>
      </Section>

      <Section title="Loading">
        <Loading />
        <Loading label="Montando o relatório..." />
      </Section>

      <Section
        title="ActionTile"
        note="Alvo de toque ≥ 48px. `emphasis` marca os registros do dia a dia."
      >
        <div className={styles.tiles}>
          <ActionTile to="/dev" label="Exposição" hint="O que foi consumido" icon={Milk} emphasis />
          <ActionTile to="/dev" label="Observação" hint="Anotação livre" icon={Milk} />
        </div>
      </Section>

      <Section title="SeveritySelector">
        <SeveritySelector symptomLabel="Muco nas fezes" value={intensity} onChange={setIntensity} />
        <p className={styles.note}>Valor: {intensity ?? 'nenhum'}</p>
      </Section>

      <Section title="SymptomRow" note="Sem seleção, com seleção e um sintoma com sinal de alarme.">
        <ul className={styles.rows}>
          {mucus && <SymptomRow symptom={mucus} value={null} onChange={() => {}} />}
          {vomit && <SymptomRow symptom={vomit} value={rowIntensity} onChange={setRowIntensity} />}
          {alarmSymptom && (
            <SymptomRow
              symptom={alarmSymptom}
              value={alarmIntensity}
              onChange={setAlarmIntensity}
            />
          )}
        </ul>
      </Section>

      <Section title="Card">
        <Card>Superfície padrão do produto.</Card>
        <Card active>Cartão em destaque — selecionado ou período corrente.</Card>
      </Section>

      <Section title="Alert" note="Cor nunca é o único sinal: sempre ícone + texto.">
        <Alert variant="success">Exposição registrada.</Alert>
        <Alert variant="error">Não foi possível salvar. Tente novamente.</Alert>
        <Alert variant="info">
          Registre apenas o que realmente observar. Não é necessário procurar sintomas.
        </Alert>
      </Section>

      <Section title="Toast" note="Confirmação passageira. O erro fica até ser fechado.">
        <div className={styles.row}>
          <Button variant="secondary" onClick={() => setToast('success')}>
            success
          </Button>
          <Button variant="secondary" onClick={() => setToast('error')}>
            error
          </Button>
          <Button variant="secondary" onClick={() => setToast('info')}>
            info
          </Button>
        </div>
      </Section>

      <Section
        title="Modal"
        note="<dialog> nativo: foco preso, Esc e fundo inerte vêm do navegador."
      >
        <Button variant="secondary" onClick={() => setModal(true)}>
          Abrir modal
        </Button>
        <Modal open={modal} title="Avançar para a etapa 2?" onClose={() => setModal(false)}>
          <Alert variant="info">
            Avance apenas se estiver seguindo o plano definido pela equipe assistente.
          </Alert>
          <div className={styles.modalButtons}>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setModal(false)}>Confirmar</Button>
          </div>
        </Modal>
      </Section>

      <Section
        title="Animações (ReactBits)"
        note="Adaptadas do reactbits.dev para os tokens do projeto. Nada acima de 320ms; prefers-reduced-motion desliga tudo."
      >
        <FadeContent>
          <Card>FadeContent — entrada de conteúdo: fade + 8px.</Card>
        </FadeContent>

        <ul className={styles.rows}>
          {['Primeiro', 'Segundo', 'Terceiro'].map((label, index) => (
            <AnimatedContent key={label} as="li" index={index}>
              <Card>AnimatedContent — {label.toLowerCase()} da lista, escalonado.</Card>
            </AnimatedContent>
          ))}
        </ul>

        <SpotlightCard>
          <Card>SpotlightCard — passe o ponteiro para ver o brilho seguir.</Card>
        </SpotlightCard>

        <Card>
          CountUp — <CountUp to={128} /> registros no período.
        </Card>

        <div className={styles.row}>
          <ClickSpark>
            <Button variant="secondary" spark={false}>
              ClickSpark — toque para ver as fagulhas
            </Button>
          </ClickSpark>
        </div>
      </Section>

      {toast && (
        <Toast message={`Toast ${toast}`} variant={toast} onDismiss={() => setToast(null)} />
      )}
    </main>
  )
}
