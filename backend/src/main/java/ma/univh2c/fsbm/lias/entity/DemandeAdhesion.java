package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutDemande;
import ma.univh2c.fsbm.lias.enums.StatutMembre;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "demandes_adhesion")
@SQLRestriction("archive = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeAdhesion extends EntiteAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutMembre statutSouhaite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_souhaitee_id")
    private Equipe equipeSouhaitee;

    private String etablissementOrigine;

    private String laboratoireOrigine;

    private String cvUrl;

    private String lettreMotivationUrl;

    @Column(columnDefinition = "TEXT")
    private String motivation;

    @Column(nullable = false)
    private LocalDateTime dateSoumission;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutDemande statut = StatutDemande.EN_ATTENTE;

    private LocalDateTime dateDecision;

    private String motifRefus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decideur_id")
    private Membre decideur;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membre_cree_id")
    private Membre membreCree;

    public void accepter(Membre decideur) {
        this.statut = StatutDemande.ACCEPTEE;
        this.decideur = decideur;
        this.dateDecision = LocalDateTime.now();
    }

    public void refuser(Membre decideur, String motif) {
        this.statut = StatutDemande.REFUSEE;
        this.decideur = decideur;
        this.motifRefus = motif;
        this.dateDecision = LocalDateTime.now();
    }
}
