package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutReunion;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "reunions")
@SQLRestriction("archive = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reunion extends EntiteAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false)
    private LocalDateTime dateReunion;

    @Column
    private String lieu;

    @Column(columnDefinition = "TEXT")
    private String ordreDuJour;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutReunion statut = StatutReunion.PLANIFIEE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organisateur_id", nullable = false)
    private Membre organisateur;

    @ManyToMany
    @JoinTable(
        name = "reunion_participants",
        joinColumns = @JoinColumn(name = "reunion_id"),
        inverseJoinColumns = @JoinColumn(name = "membre_id")
    )
    @Builder.Default
    private Set<Membre> participants = new HashSet<>();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pv_id")
    private Document pv;

    public void ajouterOrdreDuJour(String texte) {
        this.ordreDuJour = texte;
    }

    public void cloturerEtArchiver() {
        this.statut = StatutReunion.ARCHIVEE;
    }
}
