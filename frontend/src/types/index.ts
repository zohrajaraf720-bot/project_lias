export type RoleSysteme = 'ADMIN' | 'MEMBRE';
export type StatutMembre = 'PERMANENT' | 'ASSOCIE' | 'DOCTORANT';
export type EtatCompte = 'ACTIF' | 'GELE' | 'DESACTIVE';
export type TypeMandat = 'DIRECTEUR' | 'VICE_DIRECTEUR' | 'CHEF_EQUIPE';
export type TypeRole = 'MEMBRE_PERMANENT' | 'DOCTORANT' | 'CHERCHEUR_ASSOCIE';
export type StatutDemande = 'EN_ATTENTE' | 'ACCEPTEE' | 'APPROUVEE' | 'REFUSEE';
export type StatutDemandeMateriel = 'EN_ATTENTE' | 'VALIDEE' | 'REFUSEE' | 'RETOURNEE';
export type TypeEvenement = 'CONFERENCE' | 'SEMINAIRE' | 'WORKSHOP' | 'SOUTENANCE_THESE' | 'ATELIER' | 'JOURNEE_ETUDE';
export type StatutEvenement = 'EN_PREPARATION' | 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE' | 'ARCHIVE';
export type StatutValidationEvenement = 'EN_ATTENTE_VALIDATION' | 'EN_ATTENTE' | 'VALIDE' | 'REJETE';
export type StatutParticipation = 'INSCRIT' | 'CONFIRME' | 'ANNULE' | 'PRESENT';
export type TypeActivite = 'SEMINAIRE' | 'ATELIER' | 'CONF_INVITEE' | 'SOUTENANCE' | 'PROJET_RECHERCHE';
export type StatutReunion = 'PLANIFIEE' | 'EN_ATTENTE_PV' | 'ARCHIVEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
export type StatutMateriel = 'EN_STOCK' | 'DISTRIBUE' | 'DISPONIBLE' | 'ATTRIBUE' | 'EN_MAINTENANCE' | 'HORS_SERVICE' | 'REFORME';
export type TypeInstitution = 'UNIVERSITE' | 'ENTREPRISE' | 'CENTRE_RECHERCHE' | 'ORGANISME_PUBLIC';
export type StatutConvention = 'EN_COURS' | 'ACTIVE' | 'EN_NEGOCIATION' | 'EXPIREE' | 'RESILIEE';
export type TypeDocument = 'DEMANDE_FINANCEMENT' | 'PROGRAMME' | 'ATTESTATION' | 'RAPPORT' | 'ADMINISTRATIF' | 'PV' | 'CONVENTION' | 'PV_REUNION' | 'RAPPORT_ACTIVITE' | 'ARTICLE' | 'THESE' | 'REGLEMENT_INTERIEUR' | 'AUTRE';
export type StatutRapport = 'BROUILLON' | 'SOUMIS' | 'VALIDE' | 'FINALISE';
export type TypeCanal = 'DIRECT' | 'EQUIPE' | 'EVENEMENT' | 'GENERAL';
export type TypeNotification =
  | 'INFO'
  | 'ACTION_REQUISE'
  | 'URGENT'
  | 'RAPPEL'
  | 'EVENEMENT'
  | 'VALIDATION_DEMANDE'
  | 'AJOUT_DOCUMENT'
  | 'DEMANDE_ADHESION'
  | 'MATERIEL'
  | 'EQUIPE'
  | 'MANDAT'
  | 'REUNION'
  | 'PUBLICATION'
  | 'RAPPORT'
  | 'MEMBRE'
  | 'CONVENTION'
  | 'GENERAL';
export type TypePublication =
  | 'ARTICLE_JOURNAL'
  | 'CONFERENCE_INTERNATIONALE'
  | 'CONFERENCE_NATIONALE'
  | 'CHAPITRE_LIVRE'
  | 'LIVRE'
  | 'BREVET'
  | 'THESE'
  | 'AUTRE';

export interface PageDTO<T> {
  contenu: T[];
  numeroPage?: number;
  page?: number;
  taillePage?: number;
  taille?: number;
  totalElements: number;
  totalElementsGlobal?: number;
  totalPages: number;
  estPremiere?: boolean;
  estDerniere?: boolean;
  dernier?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  doitChangerMotDePasse: boolean;
  utilisateur: MeDTO;
}

export interface MeDTO {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  roleSysteme: RoleSysteme;
  statut: StatutMembre;
  etatCompte: EtatCompte;
  photo?: string;
  equipeId?: number;
  equipeNom?: string;
  authorities: string[];
  autorites?: string[];
  doitChangerMotDePasse: boolean;
}

export interface MembreResumeDTO {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  photo?: string;
  statut?: StatutMembre;
  equipeNom?: string;
  equipeId?: number;
  roleLibelle?: string;
  roleSysteme?: RoleSysteme;
}

export interface MembreInterneDTO {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  photo?: string;
  statut: StatutMembre;
  etatCompte: EtatCompte;
  equipeNom?: string;
  equipeId?: number;
  biographie?: string;
  centresInteret?: string[];
  dateAffiliation?: string;
  dateEmbauche?: string;
  etablissementOrigine?: string;
  laboratoireOrigine?: string;
}

export interface MembreProfilDTO {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  photo?: string;
  statut: StatutMembre;
  etatCompte: EtatCompte;
  biographie?: string;
  centresInteret?: string[];
  dateNaissance?: string;
  dateEmbauche?: string;
  dateAffiliation?: string;
  equipeId?: number;
  equipeNom?: string;
  etablissementOrigine?: string;
  laboratoireOrigine?: string;
}

export interface HistoriqueMembreDTO {
  membreId: number;
  entrees: {
    date: string;
    type: string;
    libelle: string;
  }[];
}

export interface EquipeDTO {
  id: number;
  nom: string;
  acronyme: string;
  description: string;
  axesRecherche: string[];
  thematiques?: string[];
  chefEquipe?: MembreResumeDTO;
  chefActuel?: MembreResumeDTO;
  nombreMembres: number;
  membres?: MembreResumeDTO[];
}

export interface DemandeChangementEquipeDTO {
  id: number;
  demandeurId: number;
  demandeurNom: string;
  demandeurPrenom: string;
  demandeurEmail: string;
  demandeurStatut?: StatutMembre;
  demandeurPhoto?: string;
  ancienneEquipeId?: number;
  ancienneEquipeNom?: string;
  ancienneEquipeAcronyme?: string;
  nouvelleEquipeId?: number;
  nouvelleEquipeNom?: string;
  nouvelleEquipeAcronyme?: string;
  typeChangement: 'RATTACHEMENT' | 'TRANSFERT' | 'DETACHEMENT';
  motif: string;
  dateDemande: string;
  statut: StatutDemande;
  dateDecision?: string;
  motifRefus?: string;
  decideurNom?: string;
}

export interface DemandeChangementEquipeRequest {
  nouvelleEquipeId?: number;
  motif: string;
}

export interface AffectationDirecteEquipeRequest {
  membreId: number;
  nouvelleEquipeId?: number | null;
  motif?: string;
}

export interface DemandeModificationEquipeDTO {
  id: number;
  equipeId: number;
  equipeNom: string;
  equipeAcronyme?: string;
  demandeurId?: number;
  demandeurNom?: string;
  demandeurEmail?: string;
  nouveauNom: string;
  nouvelleDescription?: string;
  nouvellesThematiques?: string[];
  ancienNom?: string;
  ancienneDescription?: string;
  anciennesThematiques?: string[];
  dateDemande: string;
  statut: StatutDemande;
  dateDecision?: string;
  motifRefus?: string;
  decideurNom?: string;
}

export interface EquipeDetailDTO {
  id: number;
  nom: string;
  acronyme: string;
  description: string;
  axesRecherche: string[];
  thematiques?: string[];
  logo?: string;
  chefEquipe?: MembreResumeDTO;
  chefActuel?: MembreResumeDTO;
  membres: MembreResumeDTO[];
  publications: PublicationDTO[];
}

export interface PublicationDTO {
  id: number;
  titre: string;
  type?: TypePublication;
  annee: number;
  resume?: string;
  lienDoi?: string;
  auteurs: MembreResumeDTO[];
  coAuteursExternes?: string[];
  equipeId?: number;
  equipeNom?: string;
  dateAjout?: string;
}

export interface EvenementDTO {
  id: number;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  lieu?: string;
  edition?: string;
  type: TypeEvenement;
  typeEvenement: TypeEvenement;
  statut: StatutEvenement;
  statutValidation: StatutValidationEvenement;
  dateValidation?: string;
  commentaireValidation?: string;
  valideurNom?: string;
  createdAt?: string;
  organisateurs?: MembreResumeDTO[];
  organisateur?: MembreResumeDTO;
  nombreParticipants?: number;
  nombreInscrits: number;
  lienWebinaire?: string;
  programmeDetaille?: string;
  canalId?: number;
}

export interface ParticipationDTO {
  id: number;
  membre: MembreResumeDTO;
  evenementId: number;
  evenementTitre: string;
  dateInscription: string;
  statut: StatutParticipation;
}

export interface DocumentDTO {
  id: number;
  titre: string;
  description?: string;
  nomFichier?: string;
  cheminFichier: string;
  typeDocument: TypeDocument;
  tailleFichier?: number;
  typeMime?: string;
  version: number;
  dateUpload: string;
  dateDepot?: string;
  auteur: MembreResumeDTO;
  estConfidentiel?: boolean;
  estPublic?: boolean;
  evenementId?: number;
  conventionId?: number;
  reunionId?: number;
  empreinteSha256?: string;
}

export interface VersionDocumentDTO {
  id: number;
  version: number;
  cheminFichier: string;
  dateModification: string;
  auteurId: number;
  auteurNom: string;
  tailleFichier?: number;
  commentaire?: string;
}

export interface DemandeAdhesionDTO {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  statut?: StatutDemande;
  statutDemande?: StatutDemande;
  statutSouhaite?: StatutMembre;
  typeSouhaite?: StatutMembre;
  equipeId?: number;
  equipeNom?: string;
  dateSoumission: string;
  dateDecision?: string;
  dateTraitement?: string;
  motifRefus?: string;
  commentaireDirection?: string;
  cvUrl?: string;
  cheminCv?: string;
  lettreMotivationUrl?: string;
  cheminLettreMotivation?: string;
  motivation?: string;
  etablissementOrigine?: string;
  laboratoireOrigine?: string;
  decideurNom?: string;
  membreCreeId?: number;
}

export interface ReunionDTO {
  id: number;
  titre: string;
  ordreDuJour: string;
  dateReunion?: string;
  dateHeure: string;
  lieu: string;
  statut: StatutReunion;
  organisateur: MembreResumeDTO;
  participants: MembreResumeDTO[];
  pvDocumentId?: number;
  pvDocumentNom?: string;
}

export interface MaterielDTO {
  id: number;
  designation: string;
  dateArrivage?: string;
  quantiteInitiale?: number;
  quantiteDisponible: number;
  statut: StatutMateriel;
  nom?: string;
  referenceInventaire?: string;
  quantiteTotale?: number;
  emplacement?: string;
  caracteristiques?: string;
}

export interface AttributionMaterielDTO {
  id: number;
  materielId: number;
  materielDesignation: string;
  beneficiaire: MembreResumeDTO;
  dateDistribution: string;
  dateRetour?: string;
  quantiteAttribuee: number;
}

export interface DemandeMaterielDTO {
  id: number;
  descriptionBesoin: string;
  quantite: number;
  dateSoumission: string;
  dateTraitement?: string;
  statut: StatutDemandeMateriel;
  commentaireDirection?: string;
  demandeur: MembreResumeDTO;
  materielAttribue?: string;
}

export interface DistributionMaterielGroupeRequest {
  materielId: number;
  mode: 'MEMBRES' | 'EQUIPE';
  membreIds?: number[];
  equipeId?: number;
  quantiteParMembre: number;
  motif?: string;
}

export interface PartenaireDTO {
  id: number;
  nom: string;
  typeInstitution: TypeInstitution;
  pays: string;
  siteWeb?: string;
  contactNom?: string;
  contactEmail?: string;
  conventions?: ConventionDTO[];
}

export interface ConventionDTO {
  id: number;
  partenaireId: number;
  partenaireNom: string;
  titre: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  statut: StatutConvention;
  documentChemin?: string;
}

export interface CanalDiscussionDTO {
  id: number;
  titre: string;
  typeCanal: TypeCanal;
  dateCreation: string;
  participants: MembreResumeDTO[];
  equipeId?: number;
  evenementId?: number;
  messagesNonLus: number;
  dernierMessage?: MessageDTO;
}

export interface MessageDTO {
  id: number;
  contenu: string;
  dateEnvoi: string;
  auteur: MembreResumeDTO;
  canalId: number;
}

export interface NotificationDTO {
  id: number;
  titre: string;
  message: string;
  type: TypeNotification;
  estLue: boolean;
  dateCreation: string;
  lienCible?: string;
  lienRedirection?: string;
}

export interface RapportActiviteDTO {
  id: number;
  annee: number;
  statut: StatutRapport;
  contenuMarkdown?: string;
  cheminFichierPdf?: string;
  dateGeneration?: string;
  dateCreation?: string;
  dateFinalisation?: string;
  donneesBrutes?: string;
}

export interface TraceAuditDTO {
  id: number;
  dateAction: string;
  utilisateurEmail: string;
  action: string;
  entiteAffectee: string;
  entiteId?: number;
  details?: string;
  adresseIp?: string;
}

export interface LaboratoireDTO {
  id: number;
  nom: string;
  acronyme: string;
  description: string;
  etablissement: string;
  universite: string;
  adresse: string;
  emailContact: string;
  telephone: string;
  siteWeb?: string;
  directeurNom?: string;
  dateCreation?: string;
}

export interface IndicateursDirectionDTO {
  totalMembres: number;
  totalDoctorants: number;
  totalEquipes: number;
  totalPublications: number;
  evenementsEnCours: number;
  demandesAdhesionEnAttente: number;
  demandesMaterielEnAttente: number;
}

export interface TableauBordMembreDTO {
  publications: number;
  reunions: number;
  demandesMateriel: number;
  evenements: number;
}
