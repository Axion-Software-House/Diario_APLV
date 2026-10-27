import { useEffect, useState } from 'react'
import {
  History,
  KeyRound,
  Pencil,
  Plus,
  RotateCw,
  Send,
  Shield,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react'
import { AppTemplate } from '@/components/templates/AppTemplate'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Loading } from '@/components/atoms/Loading'
import { Badge } from '@/components/atoms/Badge'
import { Alert } from '@/components/molecules/Alert'
import { Card } from '@/components/molecules/Card'
import { Toast } from '@/components/molecules/Toast'
import { Modal } from '@/components/organisms/Modal'
import {
  adminDeleteUser,
  adminInviteUser,
  adminListAuditLogs,
  adminListUsers,
  adminResendInvite,
  adminSendPasswordReset,
  adminSuspendUser,
  adminUpdateUser,
} from '@/services/admin'
import type { AdminAuditLog, AdminUserItem, UserSituation } from '@/services/admin'
import { formatDate, formatDateTime } from '@/utils/dates'
import styles from './Admin.module.css'

const SITUATION_LABELS: Record<UserSituation, { label: string; tone: 'success' | 'primary' | 'danger' }> = {
  active: { label: 'Ativo', tone: 'success' },
  invited: { label: 'Convite pendente', tone: 'primary' },
  suspended: { label: 'Suspenso', tone: 'danger' },
}

export default function Admin() {
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [search, setSearch] = useState('')
  const [toastMessage, setToastMessage] = useState<string>()

  // Modal de Convidar
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteError, setInviteError] = useState<string>()

  // Modal de Editar
  const [editUser, setEditUser] = useState<AdminUserItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editBusy, setEditBusy] = useState(false)
  const [editError, setEditError] = useState<string>()

  // Modal de Excluir
  const [deleteUser, setDeleteUser] = useState<AdminUserItem | null>(null)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string>()

  // Modal de Auditoria
  const [auditOpen, setAuditOpen] = useState(false)
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  async function loadUsers(query = search) {
    setLoading(true)
    setErrorMessage(undefined)
    try {
      const data = await adminListUsers(query)
      setUsers(data.users)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    void loadUsers(search)
  }

  // --- Ações de Convidar ---
  function openInviteModal() {
    setInviteName('')
    setInviteEmail('')
    setInviteError(undefined)
    setInviteOpen(true)
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      setInviteError('Informe o e-mail do usuário.')
      return
    }

    setInviteBusy(true)
    setInviteError(undefined)
    try {
      await adminInviteUser(inviteEmail.trim(), inviteName.trim())
      setInviteOpen(false)
      setToastMessage('Convite enviado com sucesso.')
      await loadUsers()
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Erro ao enviar convite.')
    } finally {
      setInviteBusy(false)
    }
  }

  async function handleResendInvite(user: AdminUserItem) {
    try {
      await adminResendInvite(user.email, user.name)
      setToastMessage(`Convite reenviado para ${user.email}.`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao reenviar convite.')
    }
  }

  // --- Ações de Editar ---
  function openEditModal(user: AdminUserItem) {
    setEditUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditError(undefined)
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editUser) return

    setEditBusy(true)
    setEditError(undefined)
    try {
      await adminUpdateUser(editUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
      })
      setEditUser(null)
      setToastMessage('Dados do usuário atualizados.')
      await loadUsers()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erro ao atualizar usuário.')
    } finally {
      setEditBusy(false)
    }
  }

  async function handleToggleSuspend() {
    if (!editUser) return
    const willSuspend = editUser.situation !== 'suspended'

    setEditBusy(true)
    setEditError(undefined)
    try {
      await adminSuspendUser(editUser.id, willSuspend)
      setEditUser(null)
      setToastMessage(willSuspend ? 'Acesso suspenso com sucesso.' : 'Acesso reativado com sucesso.')
      await loadUsers()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erro ao alterar suspensão.')
    } finally {
      setEditBusy(false)
    }
  }

  async function handleSendResetPassword() {
    if (!editUser) return

    setEditBusy(true)
    setEditError(undefined)
    try {
      await adminSendPasswordReset(editUser.email)
      setToastMessage(`E-mail de redefinição de senha enviado para ${editUser.email}.`)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erro ao enviar redefinição de senha.')
    } finally {
      setEditBusy(false)
    }
  }

  // --- Ações de Excluir ---
  function openDeleteModal(user: AdminUserItem) {
    setDeleteUser(user)
    setDeleteConfirmEmail('')
    setDeleteError(undefined)
  }

  async function handleConfirmDelete() {
    if (!deleteUser) return

    if (deleteConfirmEmail.trim().toLowerCase() !== deleteUser.email.toLowerCase()) {
      setDeleteError('O e-mail digitado não confere exatamente com o e-mail da conta.')
      return
    }

    setDeleteBusy(true)
    setDeleteError(undefined)
    try {
      await adminDeleteUser(deleteUser.id, deleteConfirmEmail.trim())
      setDeleteUser(null)
      setToastMessage('Conta excluída com sucesso.')
      await loadUsers()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao excluir conta.')
    } finally {
      setDeleteBusy(false)
    }
  }

  // --- Ações de Auditoria ---
  async function openAuditModal() {
    setAuditOpen(true)
    setAuditLoading(true)
    try {
      const logs = await adminListAuditLogs(50)
      setAuditLogs(logs)
    } catch {
      setAuditLogs([])
    } finally {
      setAuditLoading(false)
    }
  }

  return (
    <AppTemplate
      title="Administração de Acessos"
      subtitle="Painel do Superusuário — controle de contas e permissões."
      backTo="/app"
    >
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(undefined)} />
      )}

      <div className={styles.container}>
        <div className={styles.notice}>
          <Alert variant="info">
          <Shield size={18} aria-hidden="true" />
          <span>
            <strong>Privacidade e LGPD:</strong> Esta tela gerencia apenas credenciais e acessos ao
            sistema. Dados de saúde e das crianças continuam estritamente protegidos pelo isolamento
            de conta do usuário.
          </span>
        </Alert>
        </div>

        <section className={styles.topBar} aria-label="Controles administrativos">
          <form className={styles.searchWrapper} onSubmit={handleSearchSubmit}>
            <Input
              label="Buscar usuário"
              placeholder="Digite o e-mail ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className={styles.topButtons}>
            <Button variant="secondary" onClick={openAuditModal}>
              <History size={16} aria-hidden="true" />
              <span>Auditoria</span>
            </Button>
            <Button onClick={openInviteModal}>
              <Plus size={16} aria-hidden="true" />
              <span>Convidar usuário</span>
            </Button>
          </div>
        </section>

        {loading && <Loading label="Carregando lista de acessos..." />}

        {!loading && errorMessage && <Alert variant="error">{errorMessage}</Alert>}

        {!loading && !errorMessage && users.length === 0 && (
          <div className={styles.emptyState}>
            <p>Nenhum usuário encontrado{search ? ` para "${search}"` : ''}.</p>
          </div>
        )}

        {!loading && !errorMessage && users.length > 0 && (
          <div className={styles.userList} role="list" aria-label="Usuários do sistema">
            {users.map((u) => {
              const sit = SITUATION_LABELS[u.situation]

              return (
                <Card key={u.id} as="article" className={styles.userCard}>
                  <div className={styles.userCardHeader}>
                    <div className={styles.userInfo}>
                      <h2 className={styles.userName}>{u.name || 'Sem nome cadastrado'}</h2>
                      <p className={styles.userEmail}>{u.email}</p>
                    </div>
                    <Badge tone={sit.tone}>{sit.label}</Badge>
                  </div>

                  <div className={styles.userMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Data de criação</span>
                      <span className={styles.metaValue}>{formatDate(u.createdAt)}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Último acesso</span>
                      <span className={styles.metaValue}>
                        {u.lastSignInAt ? formatDateTime(u.lastSignInAt) : 'Nunca acessou'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.userActions}>
                    {u.situation === 'invited' && (
                      <Button variant="secondary" onClick={() => handleResendInvite(u)}>
                        <RotateCw size={14} aria-hidden="true" />
                        <span>Reenviar convite</span>
                      </Button>
                    )}

                    <Button variant="secondary" onClick={() => openEditModal(u)}>
                      <Pencil size={14} aria-hidden="true" />
                      <span>Editar</span>
                    </Button>

                    <Button variant="danger" onClick={() => openDeleteModal(u)}>
                      <Trash2 size={14} aria-hidden="true" />
                      <span>Excluir</span>
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal: Convidar Usuário */}
      <Modal open={inviteOpen} title="Convidar novo usuário" onClose={() => setInviteOpen(false)}>
        <form onSubmit={handleSendInvite} className={styles.modalForm}>
          <p className={styles.modalSectionText}>
            A pessoa receberá um e-mail com link para definir a própria senha e acessar o sistema.
          </p>

          <Input
            label="Nome do responsável"
            placeholder="Ex.: Mariana Silva"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
          />

          <Input
            label="E-mail"
            type="email"
            placeholder="mariana@exemplo.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          {inviteError && <Alert variant="error">{inviteError}</Alert>}

          <div className={styles.modalButtons}>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" busy={inviteBusy} busyLabel="Enviando...">
              <Send size={16} aria-hidden="true" />
              <span>Enviar convite</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Usuário */}
      <Modal
        open={Boolean(editUser)}
        title="Editar acesso do usuário"
        onClose={() => setEditUser(null)}
      >
        {editUser && (
          <form onSubmit={handleSaveEdit} className={styles.modalForm}>
            <Input
              label="Nome do responsável"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <Input
              label="E-mail"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />

            <div className={styles.modalButtons}>
              <Button type="submit" busy={editBusy} busyLabel="Salvando...">
                Salvar alterações
              </Button>
            </div>

            <section className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>Redefinição de senha</h3>
              <p className={styles.modalSectionText}>
                O superusuário nunca vê nem define a senha de ninguém. Dispare o e-mail oficial para
                que a pessoa redefina sua senha com segurança.
              </p>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  busy={editBusy}
                  onClick={handleSendResetPassword}
                >
                  <KeyRound size={16} aria-hidden="true" />
                  <span>Enviar link de redefinição</span>
                </Button>
              </div>
            </section>

            <section className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>Controle de acesso</h3>
              <p className={styles.modalSectionText}>
                {editUser.situation === 'suspended'
                  ? 'Este usuário está suspenso e não consegue fazer login no aplicativo.'
                  : 'Ao suspender, o login deste usuário fica bloqueado sem apagar os dados do diário.'}
              </p>
              <div>
                <Button
                  type="button"
                  variant={editUser.situation === 'suspended' ? 'secondary' : 'danger'}
                  busy={editBusy}
                  onClick={handleToggleSuspend}
                >
                  {editUser.situation === 'suspended' ? (
                    <>
                      <UserCheck size={16} aria-hidden="true" />
                      <span>Reativar acesso</span>
                    </>
                  ) : (
                    <>
                      <UserX size={16} aria-hidden="true" />
                      <span>Suspender acesso</span>
                    </>
                  )}
                </Button>
              </div>
            </section>

            {editError && <Alert variant="error">{editError}</Alert>}
          </form>
        )}
      </Modal>

      {/* Modal: Excluir Usuário */}
      <Modal open={Boolean(deleteUser)} title="Excluir conta definitivamente" onClose={() => setDeleteUser(null)}>
        {deleteUser && (
          <div className={styles.modalForm}>
            <div className={styles.deleteWarning}>
              <Alert variant="error">
                <strong>Atenção: Ação irreversível!</strong>
                <p>
                  Esta ação apagará em cascata a conta, o cadastro da criança e todos os registros
                  do diário associados. Não há como recuperar esses dados depois de excluídos.
                </p>
              </Alert>

              <Alert variant="info">
                <strong>Alternativa recomendada:</strong> Se você deseja apenas bloquear o login
                deste usuário, utilize a opção <em>Suspender acesso</em> na tela de edição.
              </Alert>
            </div>

            <p className={styles.modalSectionText}>
              Para confirmar a exclusão permanente, digite exatamente o e-mail da conta:{' '}
              <strong>{deleteUser.email}</strong>
            </p>

            <Input
              label="Confirmação de e-mail"
              placeholder={deleteUser.email}
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
            />

            {deleteError && <Alert variant="error">{deleteError}</Alert>}

            <div className={styles.modalButtons}>
              <Button variant="ghost" onClick={() => setDeleteUser(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                disabled={
                  deleteConfirmEmail.trim().toLowerCase() !== deleteUser.email.toLowerCase()
                }
                busy={deleteBusy}
                busyLabel="Excluindo..."
                onClick={handleConfirmDelete}
              >
                <Trash2 size={16} aria-hidden="true" />
                <span>Excluir definitivamente</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Log de Auditoria */}
      <Modal open={auditOpen} title="Registro de auditoria administrativa" onClose={() => setAuditOpen(false)}>
        <div>
          <p className={styles.modalSectionText}>
            Histórico das últimas ações realizadas por superusuários no sistema.
          </p>

          {auditLoading && <Loading label="Carregando logs de auditoria..." />}

          {!auditLoading && auditLogs.length === 0 && (
            <p className={styles.emptyState}>Nenhum registro de auditoria encontrado.</p>
          )}

          {!auditLoading && auditLogs.length > 0 && (
            <div className={styles.auditTableWrapper}>
              <table className={styles.auditTable}>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Ação</th>
                    <th>Superusuário</th>
                    <th>Usuário Alvo</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDateTime(log.created_at)}</td>
                      <td>
                        <strong>{log.action}</strong>
                      </td>
                      <td>{log.actor_email || 'superusuário'}</td>
                      <td>{log.target_email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </AppTemplate>
  )
}
