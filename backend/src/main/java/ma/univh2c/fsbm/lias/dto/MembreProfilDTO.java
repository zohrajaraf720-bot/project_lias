package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.EtatCompte;
import ma.univh2c.fsbm.lias.enums.RoleSysteme;
import ma.univh2c.fsbm.lias.enums.StatutMembre;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembreProfilDTO {
    private Long id;
    private String photo;
    private String nom;
    private String prenom;
    private String email;
    private RoleSysteme roleSysteme;
    private StatutMembre statut;
    private EtatCompte etatCompte;
    private String etablissementOrigine;
    private String laboratoireOrigine;
    private String biographie;
    private List<String> centresInteret;
    private LocalDate dateNaissance;
    private LocalDate dateEmbauche;
    private LocalDate dateAffiliation;
    private LocalDate dateRetraite;
    private LocalDate dateDepart;
    private Long equipeId;
    private String equipeNom;
}
