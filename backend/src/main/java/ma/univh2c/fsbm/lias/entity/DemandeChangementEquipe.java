package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutDemande;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "demandes_changement_equipe")
@SQLRestriction("archive = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeChangementEquipe extends EntiteAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demandeur_id", nullable = false)
    private Membre demandeur;

    /**
     * Équipe actuelle au moment de la demande (null si le membre n'a pas d'équipe)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ancienne_equipe_id")
    private Equipe ancienneEquipe;

    /**
     * Nouvelle équipe souhaitée (null si le membre souhaite quitter son équipe sans en intégrer une autre)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nouvelle_equipe_id")
    private Equipe nouvelleEquipe;

    @Column(columnDefinition = "TEXT")
    private String motif;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime dateDemande = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutDemande statut = StatutDemande.EN_ATTENTE;

    private LocalDateTime dateDecision;

    @Column(columnDefinition = "TEXT")
    private String motifRefus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decideur_id")
    private Membre decideur;

    public String getTypeChangement() {
        if (ancienneEquipe == null && nouvelleEquipe != null) {
            return "RATTACHEMENT";
        } else if (ancienneEquipe != null && nouvelleEquipe != null) {
            return "TRANSFERT";
        } else {
            return "DETACHEMENT";
        }
    }

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
