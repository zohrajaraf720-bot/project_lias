package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeCanal;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "canaux_discussion")
@SQLRestriction("archive = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CanalDiscussion extends EntiteAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TypeCanal typeCanal;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    @ManyToMany
    @JoinTable(
        name = "canal_participants",
        joinColumns = @JoinColumn(name = "canal_id"),
        inverseJoinColumns = @JoinColumn(name = "membre_id")
    )
    @Builder.Default
    private Set<Membre> participants = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id")
    private Equipe equipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evenement_id")
    private EvenementScientifique evenement;

    @OneToMany(mappedBy = "canal", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Message> messages = new ArrayList<>();
}
