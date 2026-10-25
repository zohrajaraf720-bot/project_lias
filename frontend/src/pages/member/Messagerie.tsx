import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  Users,
  Plus,
  Search,
  Globe,
  MessageSquare,
  Shield,
  User,
  Hash,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { CanalDiscussionDTO, MessageDTO, MembreResumeDTO } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Modal } from '../../components/Modal';
import { useWebSocket } from '../../lib/useWebSocket';
import { useToast } from '../../lib/toastContext';
import { Avatar } from '../../components/Avatar';
import { RoleBadge } from '../../components/RoleBadge';
export { RoleBadge };

export const Messagerie: React.FC = () => {
  const { user } = useAuth();
  const { error, success } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [canaux, setCanaux] = useState<CanalDiscussionDTO[]>([]);
  const [selectedCanalId, setSelectedCanalId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Filters & search
  const [canalFilter, setCanalFilter] = useState<'ALL' | 'GROUPES' | 'DIRECTS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collegues, setCollegues] = useState<MembreResumeDTO[]>([]);
  const [modalSearch, setModalSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const updateUrlForCanal = useCallback(
    (canal: CanalDiscussionDTO | undefined | null) => {
      if (!canal) return;
      if (canal.typeCanal === 'GENERAL') {
        setSearchParams({ type: 'lab' }, { replace: true });
      } else if (canal.typeCanal === 'EQUIPE') {
        setSearchParams({ type: 'equipe' }, { replace: true });
      } else if (canal.typeCanal === 'DIRECT') {
        const partner = canal.participants?.find((p) => p.id !== user?.id);
        if (partner?.id) {
          setSearchParams({ type: 'direct', id: String(partner.id) }, { replace: true });
        }
      }
    },
    [user?.id, setSearchParams]
  );

  const doesCurrentCanalMatchParams = useCallback(
    (canal: CanalDiscussionDTO | null | undefined) => {
      if (!canal) return false;
      const rawType = (searchParams.get('type') || searchParams.get('typeCanal') || '').toLowerCase();
      const rawDestId = searchParams.get('id') || searchParams.get('membreId') || searchParams.get('destinataireId');

      if (rawType === 'lab' || rawType === 'general') {
        return canal.typeCanal === 'GENERAL';
      }
      if (rawType === 'equipe') {
        return canal.typeCanal === 'EQUIPE';
      }
      if (rawType === 'direct' || rawDestId) {
        if (canal.typeCanal !== 'DIRECT') return false;
        if (!rawDestId) return true;
        return canal.participants?.some((p) => p.id === Number(rawDestId)) ?? false;
      }
      return false;
    },
    [searchParams]
  );

  const handleSelectCanal = (c: CanalDiscussionDTO) => {
    setSelectedCanalId(c.id);
    updateUrlForCanal(c);
  };

  const fetchCanaux = async (explicitCanalId?: number) => {
    try {
      const res = await api.get<CanalDiscussionDTO[]>('/messagerie/canaux');
      let data = res.data || [];

      const rawType = (searchParams.get('type') || searchParams.get('typeCanal') || '').toLowerCase();
      const rawDestId = searchParams.get('id') || searchParams.get('membreId') || searchParams.get('destinataireId');
      const paramCanalId = explicitCanalId || (searchParams.get('canalId') ? Number(searchParams.get('canalId')) : null);

      let targetCanal: CanalDiscussionDTO | null = null;

      if (rawDestId || rawType === 'direct') {
        const destId = rawDestId ? Number(rawDestId) : null;
        if (destId) {
          // Find existing direct channel with that member
          let directCanal = data.find(
            (c) => c.typeCanal === 'DIRECT' && c.participants?.some((p) => p.id === destId)
          );

          if (!directCanal) {
            try {
              const createRes = await api.post<CanalDiscussionDTO>('/messagerie/canaux', {
                destinataireId: destId,
              });
              if (createRes.data?.id) {
                directCanal = createRes.data;
                if (!data.some((c) => c.id === createRes.data.id)) {
                  data = [createRes.data, ...data];
                }
              }
            } catch (createErr) {
              console.error('Erreur ouverture discussion avec membre:', createErr);
            }
          }
          if (directCanal) {
            targetCanal = directCanal;
          }
        }
      } else if (rawType === 'equipe') {
        const equipeCanal = data.find((c) => c.typeCanal === 'EQUIPE');
        if (equipeCanal) {
          targetCanal = equipeCanal;
        }
      } else if (rawType === 'lab' || rawType === 'general') {
        const generalCanal = data.find((c) => c.typeCanal === 'GENERAL');
        if (generalCanal) {
          targetCanal = generalCanal;
        }
      } else if (paramCanalId) {
        targetCanal = data.find((c) => c.id === paramCanalId) || null;
      }

      setCanaux(data);

      if (targetCanal) {
        setSelectedCanalId(targetCanal.id);
        updateUrlForCanal(targetCanal);
      } else if (data.length > 0) {
        setSelectedCanalId((current) => {
          const currentCanal = current ? data.find((c) => c.id === current) : null;
          const chosen = currentCanal || data[0];
          updateUrlForCanal(chosen);
          return chosen.id;
        });
      }
    } catch (err: any) {
      console.error('Erreur chargement canaux', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (canalId: number) => {
    setMessagesLoading(true);
    try {
      const res = await api.get<MessageDTO[]>(`/messagerie/canaux/${canalId}/messages`);
      setMessages(res.data || []);
      api.put(`/messagerie/canaux/${canalId}/lu`).catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    const currentCanal = canaux.find((c) => c.id === selectedCanalId);
    if (currentCanal && doesCurrentCanalMatchParams(currentCanal)) {
      return;
    }
    fetchCanaux();
  }, [searchParams]);

  useEffect(() => {
    api.get<{ contenu: MembreResumeDTO[] }>('/membres?taille=100').then((r) => {
      setCollegues((r.data?.contenu || []).filter((m) => m.id !== user?.id));
    });
  }, [user?.id]);

  useEffect(() => {
    if (selectedCanalId) {
      fetchMessages(selectedCanalId);
    }
  }, [selectedCanalId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Live WebSocket message handler
  useWebSocket({
    canalId: selectedCanalId || undefined,
    onMessage: (newMsg) => {
      if (newMsg.canalId === selectedCanalId) {
        setMessages((prev) => [...prev, newMsg]);
      } else {
        fetchCanaux();
      }
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauMessage.trim() || !selectedCanalId) return;

    const texte = nouveauMessage.trim();
    setNouveauMessage('');

    try {
      const res = await api.post<MessageDTO>('/messagerie/messages', {
        canalId: selectedCanalId,
        contenu: texte,
      });

      setMessages((prev) => {
        if (prev.some((m) => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      fetchCanaux();
    } catch (err: any) {
      error(err.response?.data?.message || "Erreur lors de l'envoi du message.");
    }
  };

  const handleSelectOrCreateDirect = async (destinataireId: number) => {
    try {
      const res = await api.post<CanalDiscussionDTO>('/messagerie/canaux', {
        destinataireId,
      });

      setIsModalOpen(false);
      if (res.data?.id) {
        setSelectedCanalId(res.data.id);
        updateUrlForCanal(res.data);
      }
      fetchCanaux();
    } catch (err: any) {
      error(err.response?.data?.message || 'Erreur lors de l’ouverture de la discussion.');
    }
  };

  // Find active canal and other participant if direct
  const activeCanal = canaux.find((c) => c.id === selectedCanalId);
  const otherParticipant = useMemo(() => {
    if (!activeCanal || activeCanal.typeCanal !== 'DIRECT') return null;
    return activeCanal.participants?.find((p) => p.id !== user?.id) || null;
  }, [activeCanal, user?.id]);

  // Canaux filtered
  const filteredCanaux = useMemo(() => {
    return canaux.filter((c) => {
      const matchesFilter =
        canalFilter === 'ALL'
          ? true
          : canalFilter === 'GROUPES'
          ? c.typeCanal === 'GENERAL' || c.typeCanal === 'EQUIPE'
          : c.typeCanal === 'DIRECT';

      const matchesSearch =
        !searchQuery.trim() ||
        c.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.dernierMessage?.contenu?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [canaux, canalFilter, searchQuery]);

  // Collegues filtered for modal
  const filteredCollegues = useMemo(() => {
    if (!modalSearch.trim()) return collegues;
    const q = modalSearch.toLowerCase();
    return collegues.filter(
      (col) =>
        col.nom.toLowerCase().includes(q) ||
        col.prenom.toLowerCase().includes(q) ||
        col.email.toLowerCase().includes(q) ||
        (col.equipeNom && col.equipeNom.toLowerCase().includes(q)) ||
        (col.roleLibelle && col.roleLibelle.toLowerCase().includes(q)) ||
        (col.statut && col.statut.toLowerCase().includes(q))
    );
  }, [collegues, modalSearch]);

  // Whole Lab canal and Equipe canal shortcuts
  const canalGeneral = canaux.find((c) => c.typeCanal === 'GENERAL');
  const canalEquipe = canaux.find((c) => c.typeCanal === 'EQUIPE');

  const handleOpenGroup = (canal: CanalDiscussionDTO | undefined) => {
    if (canal) {
      setSelectedCanalId(canal.id);
      updateUrlForCanal(canal);
      setIsModalOpen(false);
    } else {
      fetchCanaux().then(() => {
        setIsModalOpen(false);
      });
    }
  };

  if (loading) {
    return <LoadingSpinner text="Chargement de votre messagerie interne..." />;
  }

  return (
    <div className="h-[calc(100vh-9.5rem)] bg-white rounded-3xl border border-slate-200/80 shadow-xs flex overflow-hidden">
      {/* Sidebar: Channels List */}
      <div className="w-80 sm:w-88 border-r border-slate-100 flex flex-col h-full bg-slate-50/50">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-slate-800 text-sm">Messagerie Interne</h2>
            </div>
            <button
              onClick={() => {
                setModalSearch('');
                setIsModalOpen(true);
              }}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs shadow-blue-500/20"
              title="Nouvelle conversation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher une discussion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100/70 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1 p-0.5 bg-slate-100 rounded-xl text-[11px] font-semibold">
            <button
              onClick={() => setCanalFilter('ALL')}
              className={`flex-1 py-1 rounded-lg transition ${
                canalFilter === 'ALL' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setCanalFilter('GROUPES')}
              className={`flex-1 py-1 rounded-lg transition ${
                canalFilter === 'GROUPES' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Groupes
            </button>
            <button
              onClick={() => setCanalFilter('DIRECTS')}
              className={`flex-1 py-1 rounded-lg transition ${
                canalFilter === 'DIRECTS' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Directs
            </button>
          </div>
        </div>

        {/* Canaux Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80">
          {filteredCanaux.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Aucune conversation trouvée.
            </div>
          ) : (
            filteredCanaux.map((c) => {
              const isSelected = c.id === selectedCanalId;
              const isGeneral = c.typeCanal === 'GENERAL';
              const isEquipe = c.typeCanal === 'EQUIPE';
              const isDirect = c.typeCanal === 'DIRECT';

              // If direct, find partner
              const partner = isDirect ? c.participants?.find((p) => p.id !== user?.id) : null;

              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectCanal(c)}
                  className={`w-full p-3.5 text-left transition flex items-start gap-3 ${
                    isSelected ? 'bg-white shadow-xs border-r-2 border-r-blue-600' : 'hover:bg-slate-100/60'
                  }`}
                >
                  {/* Icon or Avatar */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isGeneral ? (
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shadow-xs">
                        <Globe className="w-5 h-5" />
                      </div>
                    ) : isEquipe ? (
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shadow-xs">
                        <Users className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center overflow-hidden">
                        {partner?.photo ? (
                          <img src={partner.photo} alt={partner.nom} className="w-full h-full object-cover" />
                        ) : (
                          <span>{c.titre ? c.titre[0].toUpperCase() : 'U'}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Canal Info */}
                  <div className="flex-1 overflow-hidden min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {c.titre}
                      </span>
                      {c.messagesNonLus > 0 && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {c.messagesNonLus}
                        </span>
                      )}
                    </div>

                    {/* Subtitle / Role Tag */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isGeneral ? (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded-md">
                          Tout le Laboratoire
                        </span>
                      ) : isEquipe ? (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-md">
                          Équipe
                        </span>
                      ) : partner ? (
                        <RoleBadge membre={partner} className="text-[9px]" />
                      ) : null}
                    </div>

                    {/* Last message */}
                    {c.dernierMessage ? (
                      <p className="text-[11px] text-slate-500 truncate mt-1">
                        <span className="font-semibold text-slate-600">
                          {c.dernierMessage.auteur?.id === user?.id ? 'Vous: ' : `${c.dernierMessage.auteur?.prenom}: `}
                        </span>
                        {c.dernierMessage.contenu}
                      </p>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic mt-1 block">Discussion prête</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Stream */}
      <div className="flex-1 flex flex-col h-full bg-slate-50/20">
        {activeCanal ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {activeCanal.typeCanal === 'GENERAL' ? (
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Globe className="w-5 h-5" />
                    </div>
                  ) : activeCanal.typeCanal === 'EQUIPE' ? (
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center overflow-hidden">
                      {otherParticipant?.photo ? (
                        <img src={otherParticipant.photo} alt={otherParticipant.nom} className="w-full h-full object-cover" />
                      ) : (
                        <span>{activeCanal.titre ? activeCanal.titre[0].toUpperCase() : 'U'}</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{activeCanal.titre}</h3>
                    {activeCanal.typeCanal === 'GENERAL' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Tout le Laboratoire
                      </span>
                    )}
                    {activeCanal.typeCanal === 'EQUIPE' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Équipe
                      </span>
                    )}
                    {otherParticipant && <RoleBadge membre={otherParticipant} />}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeCanal.typeCanal === 'GENERAL'
                      ? 'Canal public réservé aux communications globales de tout le laboratoire LIAS'
                      : activeCanal.typeCanal === 'EQUIPE'
                      ? 'Échanges internes entre les membres de l’équipe de recherche'
                      : otherParticipant?.email
                      ? `${otherParticipant.email}${otherParticipant.equipeNom ? ` • Équipe ${otherParticipant.equipeNom}` : ''}`
                      : 'Discussion privée en direct'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messagesLoading ? (
                <LoadingSpinner size="sm" text="Chargement des messages..." />
              ) : messages.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-16 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-slate-600">Aucun message pour l'instant</p>
                  <p className="text-[11px]">Soyez le premier à envoyer un message dans cette conversation !</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.auteur?.id === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {/* Author row with Role Tag */}
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[11px] font-bold text-slate-800">
                          {isMe ? 'Vous' : `${m.auteur?.prenom} ${m.auteur?.nom}`}
                        </span>

                        {/* User Role Tag */}
                        <RoleBadge membre={m.auteur} />

                        {m.auteur?.equipeNom && activeCanal.typeCanal === 'GENERAL' && (
                          <span className="text-[10px] text-slate-400">
                            • {m.auteur.equipeNom}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 ml-1">
                          {new Date(m.dateEnvoi).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-md sm:max-w-lg px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                        }`}
                      >
                        {m.contenu}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  activeCanal.typeCanal === 'GENERAL'
                    ? 'Envoyer un message à tout le laboratoire LIAS...'
                    : activeCanal.typeCanal === 'EQUIPE'
                    ? `Envoyer un message à l'équipe ${activeCanal.titre}...`
                    : `Envoyer un message à ${activeCanal.titre}...`
                }
                value={nouveauMessage}
                onChange={(e) => setNouveauMessage(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              <button
                type="submit"
                disabled={!nouveauMessage.trim()}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition disabled:opacity-40 flex-shrink-0"
                title="Envoyer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs p-8 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-300" />
            <p className="font-semibold text-slate-600">Aucune conversation sélectionnée</p>
            <p>Sélectionnez une discussion dans la liste de gauche ou démarrez-en une nouvelle.</p>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvelle Conversation"
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Quick Group Shortcuts */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Discussions de Groupe
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOpenGroup(canalGeneral)}
                className="p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition text-left flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <span>Tout le Laboratoire</span>
                    <ArrowRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition" />
                  </div>
                  <p className="text-[10px] text-indigo-700/80 mt-0.5">
                    Envoyer un message à l'ensemble des membres du laboratoire LIAS
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOpenGroup(canalEquipe)}
                className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition text-left flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <span>{canalEquipe?.titre || (user?.equipeNom ? `Équipe ${user.equipeNom}` : "Mon Équipe")}</span>
                    <ArrowRight className="w-3 h-3 text-blue-400 group-hover:translate-x-0.5 transition" />
                  </div>
                  <p className="text-[10px] text-blue-700/80 mt-0.5">
                    Échanger uniquement avec les membres de votre équipe
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Direct 1-to-1 Discussion */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Message Direct à un Membre
              </h4>
              <span className="text-[11px] text-slate-400">
                {filteredCollegues.length} membre{filteredCollegues.length > 1 ? 's' : ''} disponible{filteredCollegues.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Instant Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher par nom, rôle (Directeur, Doctorant...), ou équipe..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500 transition"
              />
            </div>

            {/* Interactive Collegues List */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 border border-slate-200/80 rounded-2xl p-2 bg-slate-50/40 divide-y divide-slate-100/80">
              {filteredCollegues.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Aucun membre trouvé correspondant à la recherche.
                </div>
              ) : (
                filteredCollegues.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => handleSelectOrCreateDirect(col.id)}
                    className="w-full p-2.5 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200/80 transition flex items-center justify-between gap-3 text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={col.photo}
                        alt={`${col.prenom} ${col.nom}`}
                        size="sm"
                        rounded="rounded-xl"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {col.prenom} {col.nom}
                          </span>
                          <RoleBadge membre={col} />
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {col.email} {col.equipeNom && `• ${col.equipeNom}`}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 flex-shrink-0">
                      <span>Discuter</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
