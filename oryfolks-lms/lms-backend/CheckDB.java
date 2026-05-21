import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckDB {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://ep-lucky-feather-a1v13ac4-pooler.ap-southeast-1.aws.neon.tech/neondb?user=neondb_owner&password=npg_4jiJnbHvIxZ6&sslmode=require&channelBinding=require";
        try {
            Connection conn = DriverManager.getConnection(url);
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT username, password, role FROM users");
            while (rs.next()) {
                System.out.println("User: " + rs.getString("username") + 
                                   ", Pass: " + rs.getString("password") + 
                                   ", Role: " + rs.getString("role"));
            }
            rs.close();
            stmt.close();
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
