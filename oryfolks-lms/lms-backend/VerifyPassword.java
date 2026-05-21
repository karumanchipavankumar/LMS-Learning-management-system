import org.springframework.security.crypto.bcrypt.BCrypt;

public class VerifyPassword {
    public static void main(String[] args) {
        String[] hashes = {
            "$2a$10$pzJw7UNp3XcZJ6Zsw4hv8O0y5Q3BR5IHKdOhbam76wUZaDY9ztiDy", // r.rahul
            "$2a$10$AO2rOYhbs7htCGGqvQF2IetapRIiUpkxru5Fg2BwuUqj12s4pFHQC", // r.madan
            "$2a$10$NJco0oPeB8Oo8ZxfS9JOye88cHPz5TjIzIAhsXPMfXMb2hNyqVF5a", // k.pavan
            "$2a$10$ak6rgIzL6yyD6FTO.4ysvObI/r0nS3ElUypR14Sjbj8EqXGGbSkSq", // g.shalini
            "$2a$10$/LALSnSAGWDG6xQdPfXb1OiXW0loKEXA3mdbLvZOIWNK7jUmNkP.y"  // m.lokesh
        };
        
        String[] candidates = {
            "password", "Password123", "admin123", "123456", "welcome", "employee", "manager",
            "rahul", "madan", "pavan", "shalini", "lokesh", "rahul123", "madan123", "pavan123", "shalini123", "lokesh123"
        };
        
        for (int i = 0; i < hashes.length; i++) {
            String hash = hashes[i];
            boolean found = false;
            for (String candidate : candidates) {
                if (BCrypt.checkpw(candidate, hash)) {
                    System.out.println("Hash " + i + " matches: " + candidate);
                    found = true;
                    break;
                }
            }
            if (!found) {
                System.out.println("Hash " + i + " did not match any candidate");
            }
        }
    }
}
