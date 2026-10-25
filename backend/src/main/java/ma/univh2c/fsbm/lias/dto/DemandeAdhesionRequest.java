package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutMembre;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DemandeAdhesionRequest {
    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotNull(message = "Le statut souhaité est obligatoire")
    private StatutMembre statutSouhaite;
    private Long equipeId;

    private String etablissementOrigine;
    private String laboratoireOrigine;
    private MultipartFile cv;
    private MultipartFile lettreMotivation;
    private String motivation;
}
