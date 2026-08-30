import { CountUp } from '@/components/animations/CountUp'
import { REPORT_DISCLAIMER } from '@/constants/disclaimers'
import { Card } from '@/components/molecules/Card'
import { TimelineList } from '@/components/organisms/TimelineList'
import { formatDate, formatDateTime, formatElapsedMinutes } from '@/utils/dates'
import type { Report } from '@/utils/report'
import type { TimelineEvent } from '@/types'
import styles from './ReportDocument.module.css'

type Props = {
  report: Report
  events: readonly TimelineEvent[]
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.field}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={styles.fieldValue}>
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

/**
 * O documento que vai para a consulta. Organiza o que a família registrou e
 * não conclui nada: sem diagnóstico, sem classificação de gravidade, sem
 * recomendação de conduta. O intervalo da temporalidade é distância no
 * tempo, nunca causa.
 */
export function ReportDocument({ report, events }: Props) {
  return (
    <article className={styles.document}>
      <p className={styles.disclaimer}>{REPORT_DISCLAIMER}</p>

      <section className={styles.section}>
        <h2 className={styles.heading}>Criança e acompanhamento</h2>
        <Card as="dl" className={styles.fields}>
          <Field label="Criança" value={report.childName} />
          <Field
            label="Data de nascimento"
            value={report.birthDate ? formatDate(report.birthDate) : 'Não informada'}
          />
          <Field label="Alimentação" value={report.feeding ?? 'Não informada'} />
          <Field
            label="Período"
            value={`${formatDate(report.startedAt)} até ${
              report.endedAt ? formatDate(report.endedAt) : 'hoje'
            }`}
          />
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
        </Card>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Registros no período</h2>
        <Card as="dl" className={styles.fields}>
          <Count label="Exposições" value={report.totals.exposures} />
          <Count label="Registros de sintomas" value={report.totals.symptoms} />
          <Count label="Registros sem sintomas" value={report.totals.noSymptoms} />
          <Count label="Fraldas" value={report.totals.diapers} />
          <Count label="Observações" value={report.totals.notes} />
        </Card>
      </section>

      {report.hasTpo && (
      <section className={styles.section}>
        <h2 className={styles.heading}>Resumo por etapa</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Etapa</th>
                <th scope="col">Dias</th>
                <th scope="col">Exposições</th>
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
                  <td>{stage.days || '—'}</td>
                  <td>{stage.exposures}</td>
                  <td>{stage.symptoms}</td>
                  <td>{stage.noSymptoms}</td>
                  <td>{stage.diapers}</td>
                  <td>{stage.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.heading}>Temporalidade</h2>
        <p className={styles.note}>
          Intervalo entre a exposição e o sintoma registrado. É a distância no tempo entre dois
          registros da família.
        </p>
        {report.temporality.length === 0 ? (
          <p className={styles.empty}>Nenhum sintoma foi relacionado a uma exposição.</p>
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
                </tr>
              </thead>
              <tbody>
                {report.temporality.map((row, index) => (
                  <tr key={`${row.occurredAt}-${row.symptom}-${index}`}>
                    <td>{formatDateTime(row.occurredAt)}</td>
                    <td>{row.symptom}</td>
                    <td>{row.intensity}</td>
                    <td>
                      {formatElapsedMinutes(row.minutes)}
                      {row.minutes >= 0 ? ' após' : ' antes'}
                    </td>
                    <td>{row.exposureFood}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Registros em ordem</h2>
        {events.length === 0 ? (
          <p className={styles.empty}>Nenhum registro no período.</p>
        ) : (
          <TimelineList events={events} />
        )}
      </section>

      <p className={styles.disclaimer}>{REPORT_DISCLAIMER}</p>
    </article>
  )
}
