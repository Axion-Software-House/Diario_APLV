import { useState } from 'react'
import type { ReactNode } from 'react'
import { CountUp } from '@/components/animations/CountUp'
import { REPORT_DISCLAIMER } from '@/constants/disclaimers'
import { AreaEmoji } from '@/components/molecules/AreaEmoji'
import type { Area } from '@/components/molecules/AreaEmoji'
import { TimelineList } from '@/components/organisms/TimelineList'
import { formatDate, formatDateTime, formatElapsedMinutes } from '@/utils/dates'
import type { Report } from '@/utils/report'
import type { TimelineEvent } from '@/types'
import styles from './ReportDocument.module.css'

type Props = {
  report: Report
  events: readonly TimelineEvent[]
}

function Count({ label, value, area }: { label: string; value: number; area?: Area }) {
  return (
    <div className={styles.count}>
      <dt className={styles.countLabel}>
        {area && <AreaEmoji area={area} size="sm" className={styles.countEmoji} />}
        <span>{label}</span>
      </dt>
      <dd className={styles.countValue}>
        <CountUp to={value} />
      </dd>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={styles.fieldValue}>{value}</dd>
    </div>
  )
}

/** Uma seção do documento: cartão na tela, bloco simples no papel. */
function Section({
  title,
  area,
  wide = false,
  children,
}: {
  title: string
  area?: Area
  wide?: boolean
  children: ReactNode
}) {
  return (
    <section className={[styles.section, wide && styles.wide].filter(Boolean).join(' ')}>
      <h2 className={styles.heading}>
        {area && <AreaEmoji area={area} size="sm" />}
        <span>{title}</span>
      </h2>
      {children}
    </section>
  )
}

/**
 * O documento que vai para a consulta. Organiza o que a família registrou e
 * não conclui nada: sem diagnóstico, sem classificação de gravidade, sem
 * recomendação de conduta. O intervalo da temporalidade é distância no
 * tempo, nunca causa.
 *
 * Na tela, cartões; no celular, cada linha de tabela vira um bloco com o
 * nome da coluna ao lado do valor (`data-label`), para nada rolar de lado.
 * No papel, preto no branco: tabelas de verdade, sem emoji, sem sombra.
 */
export function ReportDocument({ report, events }: Props) {
  const [generatedAt] = useState(() => new Date())
  const period = `${formatDate(report.startedAt)} até ${
    report.endedAt ? formatDate(report.endedAt) : 'hoje'
  }`

  return (
    <article className={styles.document}>
      {/* `div`, não `header`: o @media print de global.css esconde todo
          `header` (o do app), e este cabeçalho precisa ir para o papel. */}
      <div className={styles.docHeader}>
        <p className={styles.docKicker}>Diário APLV · Relatório para a consulta</p>
        <p className={styles.docTitle}>{report.childName}</p>
        <p className={styles.docMeta}>
          <span>Período: {period}</span>
          <span>Gerado em {formatDateTime(generatedAt)}</span>
        </p>
      </div>

      <p className={styles.disclaimer}>{REPORT_DISCLAIMER}</p>

      <Section title="Criança e acompanhamento" area="diary">
        <dl className={styles.fields}>
          <Field label="Criança" value={report.childName} />
          <Field
            label="Data de nascimento"
            value={report.birthDate ? formatDate(report.birthDate) : 'Não informada'}
          />
          <Field label="Alimentação" value={report.feeding ?? 'Não informada'} />
          <Field label="Últimas medidas" value={report.latestMeasures ?? 'Não informadas'} />
          <Field label="Período" value={period} />
          <Field
            label="Etapa atual"
            value={
              report.currentStage
                ? `${report.currentStage} de 5 — ${report.currentStageLabel}`
                : 'Sem TPO em andamento'
            }
          />
          <Field label="Motivo" value={report.reason ?? 'Não informado'} />
          <Field label="Profissional de saúde" value={report.professional ?? 'Não informado'} />
        </dl>
      </Section>

      <Section title="Registros no período" area="report">
        <dl className={styles.counts}>
          <Count label="Alimentação" area="food" value={report.totals.exposures} />
          <Count label="Registros de sintomas" area="symptom" value={report.totals.symptoms} />
          <Count label="Registros sem sintomas" area="calm" value={report.totals.noSymptoms} />
          <Count label="Fraldas" area="diaper" value={report.totals.diapers} />
          <Count label="Produtos / higiene" area="product" value={report.totals.products} />
          <Count
            label="Ambientes / visitas"
            area="environment"
            value={report.totals.environments}
          />
          <Count label="Registros de saúde" area="health" value={report.totals.health} />
          <Count label="Observações" area="note" value={report.totals.notes} />
        </dl>
        <dl className={styles.fields}>
          <Field
            label="Leite ou derivados (Sim / Não / Não sei)"
            value={`${report.totals.exposuresDairyYes} / ${report.totals.exposuresDairyNo} / ${report.totals.exposuresDairyUnknown}`}
          />
        </dl>
      </Section>

      {report.upcomingAppointments.length > 0 && (
        <Section title="Próxima consulta" area="appointment" wide>
          {report.upcomingAppointments.map((appointment) => (
            <dl key={appointment.id} className={styles.fields}>
              <Field label="Especialidade" value={appointment.specialty ?? 'Consulta'} />
              <Field label="Data e hora" value={formatDateTime(appointment.occurredAt)} />
              {appointment.questions && <Field label="Dúvidas" value={appointment.questions} />}
              {appointment.guidance && <Field label="Orientações" value={appointment.guidance} />}
              {appointment.note && <Field label="Observação" value={appointment.note} />}
            </dl>
          ))}
        </Section>
      )}

      {report.activeTreatments.length > 0 && (
        <Section title="Tratamentos ativos" area="medication" wide>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Medicamento</th>
                  <th scope="col">Prescrição informada</th>
                  <th scope="col">Início</th>
                  <th scope="col">Andamento</th>
                  <th scope="col">Doses no período</th>
                </tr>
              </thead>
              <tbody>
                {report.activeTreatments.map((treatment) => (
                  <tr key={treatment.record.id}>
                    <th scope="row" className={styles.rowHead}>
                      {treatment.name}
                    </th>
                    <td data-label="Prescrição informada">{treatment.scheduleLabel}</td>
                    <td data-label="Início">{formatDateTime(treatment.startedAt)}</td>
                    <td data-label="Andamento">{treatment.statusLabel}</td>
                    <td data-label="Doses no período">{treatment.doseCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {report.hasTpo && (
        <Section title="Resumo por etapa" area="tpo" wide>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Etapa</th>
                  <th scope="col">Dias</th>
                  <th scope="col">Alimentação</th>
                  <th scope="col">Sintomas</th>
                  <th scope="col">Sem sintomas</th>
                  <th scope="col">Fraldas</th>
                  <th scope="col">Observações</th>
                </tr>
              </thead>
              <tbody>
                {report.stages.map((stage) => (
                  <tr key={stage.stage}>
                    <th scope="row" className={styles.rowHead}>
                      {stage.stage} — {stage.label}
                      {stage.periods > 1 && (
                        <span className={styles.periods}> ({stage.periods} períodos)</span>
                      )}
                    </th>
                    <td data-label="Dias">{stage.days || '—'}</td>
                    <td data-label="Alimentação">{stage.exposures}</td>
                    <td data-label="Sintomas">{stage.symptoms}</td>
                    <td data-label="Sem sintomas">{stage.noSymptoms}</td>
                    <td data-label="Fraldas">{stage.diapers}</td>
                    <td data-label="Observações">{stage.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section title="Temporalidade" wide>
        <p className={styles.note}>
          Intervalo entre a alimentação e o sintoma registrado. É a distância no tempo entre dois
          registros da família, não uma relação de causa.
        </p>
        {report.temporality.length === 0 ? (
          <p className={styles.empty}>Nenhum sintoma foi relacionado a uma alimentação.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Data/hora</th>
                  <th scope="col">Sintoma</th>
                  <th scope="col">Intensidade</th>
                  <th scope="col">Intervalo</th>
                  <th scope="col">Alimentação</th>
                  <th scope="col">Leite ou derivados</th>
                </tr>
              </thead>
              <tbody>
                {report.temporality.map((row, index) => (
                  <tr key={`${row.occurredAt}-${row.symptom}-${index}`}>
                    <td data-label="Data/hora" className={styles.rowLead}>
                      {formatDateTime(row.occurredAt)}
                    </td>
                    <td data-label="Sintoma">{row.symptom}</td>
                    <td data-label="Intensidade">{row.intensity}</td>
                    <td data-label="Intervalo">
                      {formatElapsedMinutes(row.minutes)}
                      {row.minutes >= 0 ? ' após' : ' antes'}
                    </td>
                    <td data-label="Alimentação">{row.exposureFood}</td>
                    <td data-label="Leite ou derivados">{row.exposureDairy ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Registros em ordem" wide>
        {events.length === 0 ? (
          <p className={styles.empty}>Nenhum registro no período.</p>
        ) : (
          <TimelineList events={events} absoluteDates />
        )}
      </Section>

      <p className={styles.disclaimer}>{REPORT_DISCLAIMER}</p>
    </article>
  )
}
