package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RefreshRequest {
    @NotBlank(message = "Le refresh token est obligatoire")
    private String refreshToken;
}
