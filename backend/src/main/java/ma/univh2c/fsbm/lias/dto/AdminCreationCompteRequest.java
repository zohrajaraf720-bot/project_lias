package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.RoleSysteme;
import ma.univh2c.fsbm.lias.enums.StatutMembre;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCreationCompteRequest {
    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    private RoleSysteme roleSysteme;
    private StatutMembre statut;
    private Long equipeId;
}
