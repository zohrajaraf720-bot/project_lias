package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutRapport;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "rapports_activite")
@SQLRestriction("archive = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RapportActivite extends EntiteAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Integer annee;

    @Column(nullable = false)
    private LocalDateTime dateGeneration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutRapport statut = StatutRapport.BROUILLON;

    private String cheminFichierPdf;

    @Column(columnDefinition = "LONGTEXT")
    private String donneesBrutes;

    @Column(columnDefinition = "LONGTEXT")
    private String contenuMarkdown;

    public void finaliser() {
        this.statut = StatutRapport.FINALISE;
    }
}
