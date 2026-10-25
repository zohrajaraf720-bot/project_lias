package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {
    private Long canalId;

    @NotBlank(message = "Le contenu du message est obligatoire")
    private String contenu;

    private Long destinataireId; // pour canal direct
}
