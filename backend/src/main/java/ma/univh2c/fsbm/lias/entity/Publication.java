package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypePublication;
import org.hibernate.annotations.SQLRestriction;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "publications")
@SQLRestriction("archive = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Publication extends EntiteAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_publication")
    @Builder.Default
    private TypePublication type = TypePublication.ARTICLE_JOURNAL;

    @Column(nullable = false)
    private Integer annee;

    @Column(columnDefinition = "TEXT")
    private String resume;

    private String lienDoi;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "publication_coauteurs_externes", joinColumns = @JoinColumn(name = "publication_id"))
    @Column(name = "nom_complet")
    @Builder.Default
    private List<String> coAuteursExternes = new ArrayList<>();

    @ManyToMany
    @JoinTable(
        name = "publication_auteurs",
        joinColumns = @JoinColumn(name = "publication_id"),
        inverseJoinColumns = @JoinColumn(name = "membre_id")
    )
    @Builder.Default
    private Set<Membre> auteurs = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id")
    private Equipe equipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "convention_id")
    private Convention convention;

    public void ajouterAuteur(Membre membre) {
        this.auteurs.add(membre);
    }
}
