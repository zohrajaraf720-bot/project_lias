package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutDemandeMateriel;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "demandes_materiel")
@SQLRestriction("archive = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeMateriel extends EntiteAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String descriptionBesoin;

    @Column(nullable = false)
    private Integer quantite;

    @Column(nullable = false)
    private LocalDateTime dateSoumission;

    private LocalDateTime dateTraitement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutDemandeMateriel statut = StatutDemandeMateriel.EN_ATTENTE;

    private String commentaireDirection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demandeur_id", nullable = false)
    private Membre demandeur;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attribution_id")
    private AttributionMateriel attribution;

    public void valider() {
        this.statut = StatutDemandeMateriel.VALIDEE;
        this.dateTraitement = LocalDateTime.now();
    }

    public void refuser(String commentaire) {
        this.statut = StatutDemandeMateriel.REFUSEE;
        this.commentaireDirection = commentaire;
        this.dateTraitement = LocalDateTime.now();
    }
}
