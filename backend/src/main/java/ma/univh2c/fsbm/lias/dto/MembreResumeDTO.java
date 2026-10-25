package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.RoleSysteme;
import ma.univh2c.fsbm.lias.enums.StatutMembre;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembreResumeDTO {
    private Long id;
    private String nom;
    private String prenom;
    private String photo;
    private String email;
    private String roleLibelle;
    private StatutMembre statut;
    private RoleSysteme roleSysteme;
    private String equipeNom;
    private Long equipeId;
}
