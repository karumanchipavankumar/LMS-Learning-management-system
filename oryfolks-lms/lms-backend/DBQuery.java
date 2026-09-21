import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DBQuery {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://ep-empty-leaf-az85xz9a-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channelBinding=require";
        String user = "neondb_owner";
        String password = "npg_uOJlndhE9Dy7";

        try {
            Connection conn = DriverManager.getConnection(url, user, password);
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT username, password, role FROM users");
            while (rs.next()) {
                System.out.println("User: " + rs.getString("username") + ", Pass: " + rs.getString("password") + ", Role: " + rs.getString("role"));
            }
            rs.close();
            stmt.close();
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
