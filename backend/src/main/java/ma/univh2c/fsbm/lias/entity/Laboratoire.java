package ma.univh2c.fsbm.lias.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "laboratoire")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Laboratoire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    private String acronyme;

    private String etablissement;

    private String universite;

    private LocalDate dateCreation;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String logo;

    private String adresse;

    private String emailContact;

    private String telephone;

    private String siteWeb;
}
