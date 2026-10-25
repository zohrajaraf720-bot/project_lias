package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutDemande;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "demandes_modification_equipe")
@SQLRestriction("archive = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeModificationEquipe extends EntiteAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id", nullable = false)
    private Equipe equipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demandeur_id", nullable = false)
    private Membre demandeur;

    // Nouvelles valeurs proposées
    @Column(nullable = false)
    private String nouveauNom;

    @Column(columnDefinition = "TEXT")
    private String nouvelleDescription;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "demande_modif_equipe_thematiques", joinColumns = @JoinColumn(name = "demande_id"))
    @Column(name = "thematique")
    @Builder.Default
    private List<String> nouvellesThematiques = new ArrayList<>();

    // Anciennes valeurs au moment de la demande
    private String ancienNom;

    @Column(columnDefinition = "TEXT")
    private String ancienneDescription;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "demande_modif_equipe_anciennes_thematiques", joinColumns = @JoinColumn(name = "demande_id"))
    @Column(name = "thematique")
    @Builder.Default
    private List<String> anciennesThematiques = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime dateDemande = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutDemande statut = StatutDemande.EN_ATTENTE;

    private LocalDateTime dateDecision;

    private String motifRefus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decideur_id")
    private Membre decideur;

    public void accepter(Membre directeur) {
        this.statut = StatutDemande.ACCEPTEE;
        this.decideur = directeur;
        this.dateDecision = LocalDateTime.now();
    }

    public void refuser(Membre directeur, String motif) {
        this.statut = StatutDemande.REFUSEE;
        this.decideur = directeur;
        this.motifRefus = motif;
        this.dateDecision = LocalDateTime.now();
    }
}
