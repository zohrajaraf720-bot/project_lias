package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "equipes")
@SQLRestriction("archive = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Equipe extends EntiteAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "equipe_thematiques", joinColumns = @JoinColumn(name = "equipe_id"))
    @Column(name = "thematique")
    @Builder.Default
    private List<String> thematiques = new ArrayList<>();

    private String logo;

    @OneToMany(mappedBy = "equipeActuelle")
    @Builder.Default
    private List<Membre> membres = new ArrayList<>();

    @OneToMany(mappedBy = "equipe")
    @Builder.Default
    private List<Mandat> mandats = new ArrayList<>();

    @OneToMany(mappedBy = "equipe")
    @Builder.Default
    private List<AffectationRole> affectationsRole = new ArrayList<>();
}
