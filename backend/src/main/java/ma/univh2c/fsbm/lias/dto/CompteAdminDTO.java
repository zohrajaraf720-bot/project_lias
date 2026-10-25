package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.EtatCompte;
import ma.univh2c.fsbm.lias.enums.RoleSysteme;
import ma.univh2c.fsbm.lias.enums.StatutMembre;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompteAdminDTO {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private RoleSysteme roleSysteme;
    private StatutMembre statut;
    private EtatCompte etatCompte;
    private LocalDate dateAffiliation;
    private String equipeNom;
    private LocalDateTime createdAt;
}
