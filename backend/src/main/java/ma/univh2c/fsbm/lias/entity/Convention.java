package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutConvention;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conventions")
@SQLRestriction("archive = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Convention extends EntiteAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false)
    private LocalDate dateSignature;

    @Column(nullable = false)
    private LocalDate dateExpiration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutConvention statut = StatutConvention.EN_COURS;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partenaire_id", nullable = false)
    private Partenaire partenaire;

    @OneToMany(mappedBy = "convention")
    @Builder.Default
    private List<Document> documents = new ArrayList<>();

    @OneToMany(mappedBy = "convention")
    @Builder.Default
    private List<Activite> activites = new ArrayList<>();

    @OneToMany(mappedBy = "convention")
    @Builder.Default
    private List<EvenementScientifique> evenements = new ArrayList<>();

    @OneToMany(mappedBy = "convention")
    @Builder.Default
    private List<Publication> publications = new ArrayList<>();
}
