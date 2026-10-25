package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeInstitution;
import org.hibernate.annotations.SQLRestriction;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "partenaires")
@SQLRestriction("archive = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Partenaire extends EntiteAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nomInstitution;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeInstitution typeInstitution;

    private String pays;

    private String contactPrincipal;

    private String emailContact;

    @OneToMany(mappedBy = "partenaire")
    @Builder.Default
    private List<Convention> conventions = new ArrayList<>();
}
